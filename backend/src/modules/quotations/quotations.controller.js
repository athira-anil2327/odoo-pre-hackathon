import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

// --- Templates ---
export const getTemplates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        qt.*,
        p.name AS plan_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', qtl.id,
              'product_id', pr.id,
              'product_name', pr.name,
              'variant_id', pv.id,
              'variant_name', pv.attribute_value,
              'quantity', qtl.quantity,
              'unit_price', qtl.unit_price
            )
          ) FILTER (WHERE qtl.id IS NOT NULL), '[]'::json
        ) AS lines
      FROM quotation_templates qt
      LEFT JOIN plans p ON p.id = qt.plan_id
      LEFT JOIN quotation_template_lines qtl ON qtl.template_id = qt.id
      LEFT JOIN products pr ON pr.id = qtl.product_id
      LEFT JOIN product_variants pv ON pv.id = qtl.variant_id
      GROUP BY qt.id, p.name
      ORDER BY qt.created_at ASC;
    `);

    return successResponse(res, result.rows, "Quotation templates retrieved.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve templates: " + err.message, 500);
  }
};

export const getTemplateById = async (req, res) => {
  const { id } = req.params;

  try {
    const tmplRes = await pool.query("SELECT * FROM quotation_templates WHERE id = $1", [id]);
    if (tmplRes.rows.length === 0) {
      return errorResponse(res, "Template not found.", 404);
    }

    const linesRes = await pool.query(`
      SELECT qtl.*, pr.name AS product_name, pv.attribute_value AS variant_name
      FROM quotation_template_lines qtl
      JOIN products pr ON pr.id = qtl.product_id
      LEFT JOIN product_variants pv ON pv.id = qtl.variant_id
      WHERE qtl.template_id = $1;
    `, [id]);

    return successResponse(res, {
      ...tmplRes.rows[0],
      lines: linesRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve template: " + err.message, 500);
  }
};

export const createTemplate = async (req, res) => {
  const { name, plan_id, validity_days = 30, description, terms_and_conditions, lines = [] } = req.body;

  if (!name) {
    return errorResponse(res, "Template name is required.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const tmplRes = await client.query(
      `INSERT INTO quotation_templates (name, plan_id, validity_days, description, terms_and_conditions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [name.trim(), plan_id || null, parseInt(validity_days) || 30, description || null, terms_and_conditions || null]
    );
    const template = tmplRes.rows[0];

    for (const line of lines) {
      await client.query(
        `INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, tax_rule_id)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [template.id, line.product_id, line.variant_id || null, line.quantity || 1, line.unit_price || null, line.tax_rule_id || null]
      );
    }

    await client.query("COMMIT;");
    return successResponse(res, template, "Template created successfully.", 201);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to create template: " + err.message, 500);
  } finally {
    client.release();
  }
};

// --- Quotations ---
export const getQuotations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        q.*,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        p.name AS plan_name,
        p.billing_frequency,
        s.id AS converted_subscription_id,
        s.subscription_number AS converted_subscription_number
      FROM quotations q
      JOIN customers c ON c.id = q.customer_id
      JOIN plans p ON p.id = q.plan_id
      LEFT JOIN subscriptions s ON s.quotation_id = q.id
      ORDER BY q.created_at DESC;
    `);

    return successResponse(res, result.rows, "Quotations retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve quotations: " + err.message, 500);
  }
};

export const getQuotationById = async (req, res) => {
  const { id } = req.params;

  try {
    const quoteRes = await pool.query(`
      SELECT 
        q.*,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        c.billing_address,
        p.name AS plan_name,
        p.billing_frequency,
        s.id AS converted_subscription_id,
        s.subscription_number AS converted_subscription_number
      FROM quotations q
      JOIN customers c ON c.id = q.customer_id
      JOIN plans p ON p.id = q.plan_id
      LEFT JOIN subscriptions s ON s.quotation_id = q.id
      WHERE q.id = $1;
    `, [id]);

    if (quoteRes.rows.length === 0) {
      return errorResponse(res, "Quotation not found.", 404);
    }

    const linesRes = await pool.query(`
      SELECT ql.*, pr.name AS catalog_product_name
      FROM quotation_lines ql
      JOIN products pr ON pr.id = ql.product_id
      WHERE ql.quotation_id = $1
      ORDER BY ql.created_at ASC;
    `, [id]);

    return successResponse(res, {
      ...quoteRes.rows[0],
      lines: linesRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve quotation: " + err.message, 500);
  }
};

export const createQuotation = async (req, res) => {
  const {
    customer_id,
    plan_id,
    template_id,
    valid_until,
    payment_terms = "Net 30",
    notes,
    terms_and_conditions,
    lines = []
  } = req.body;

  if (!customer_id || !plan_id) {
    return errorResponse(res, "customer_id and plan_id are required.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    // Default valid_until to 30 days from now if omitted
    const validityDate = valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Compute lines breakdown
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const computedLines = [];
    for (const item of lines) {
      const prodRes = await client.query("SELECT name, sales_price FROM products WHERE id = $1", [item.product_id]);
      if (prodRes.rows.length === 0) continue;

      let variantName = null;
      let extra = 0;
      if (item.variant_id) {
        const vRes = await client.query("SELECT attribute_value, price_extra FROM product_variants WHERE id = $1", [item.variant_id]);
        if (vRes.rows.length > 0) {
          variantName = vRes.rows[0].attribute_value;
          extra = parseFloat(vRes.rows[0].price_extra) || 0;
        }
      }

      const unitPrice = item.unit_price !== undefined ? parseFloat(item.unit_price) : (parseFloat(prodRes.rows[0].sales_price) + extra);
      const quantity = parseInt(item.quantity) || 1;
      const lineSubtotal = quantity * unitPrice;

      let taxRate = 0;
      if (item.tax_rule_id) {
        const taxRes = await client.query("SELECT rate FROM tax_rules WHERE id = $1", [item.tax_rule_id]);
        if (taxRes.rows.length > 0) taxRate = parseFloat(taxRes.rows[0].rate);
      }

      const lineDiscount = parseFloat(item.discount_amount) || 0;
      const taxable = lineSubtotal - lineDiscount;
      const lineTax = Math.round((taxable * (taxRate / 100)) * 100) / 100;
      const lineTotal = lineSubtotal - lineDiscount + lineTax;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;

      computedLines.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: prodRes.rows[0].name,
        variant_name: variantName,
        description: item.description || prodRes.rows[0].name,
        quantity,
        unit_price: unitPrice,
        line_subtotal: lineSubtotal,
        tax_rule_id: item.tax_rule_id || null,
        tax_rate_snapshot: taxRate,
        tax_amount: lineTax,
        discount_amount: lineDiscount,
        line_total: lineTotal
      });
    }

    const totalAmount = subtotal - discountTotal + taxTotal;

    const quoteRes = await client.query(
      `INSERT INTO quotations (
        customer_id, plan_id, template_id, status, valid_until,
        payment_terms, subtotal, tax_total, discount_total, total_amount,
        notes, terms_and_conditions
      )
      VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;`,
      [
        customer_id, plan_id, template_id || null, validityDate,
        payment_terms, subtotal, taxTotal, discountTotal, totalAmount,
        notes || null, terms_and_conditions || null
      ]
    );
    const quotation = quoteRes.rows[0];

    for (const cl of computedLines) {
      await client.query(
        `INSERT INTO quotation_lines (
          quotation_id, product_id, variant_id, product_name, variant_name, description,
          quantity, unit_price, line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount,
          discount_amount, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        [
          quotation.id, cl.product_id, cl.variant_id, cl.product_name, cl.variant_name, cl.description,
          cl.quantity, cl.unit_price, cl.line_subtotal, cl.tax_rule_id, cl.tax_rate_snapshot, cl.tax_amount,
          cl.discount_amount, cl.line_total
        ]
      );
    }

    await client.query("COMMIT;");
    return successResponse(res, quotation, "Quotation proposal drafted successfully.", 201);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to create quotation: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const createQuotationFromTemplate = async (req, res) => {
  const { template_id, customer_id, custom_lines = null } = req.body;

  if (!template_id || !customer_id) {
    return errorResponse(res, "template_id and customer_id are required.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const tmplRes = await client.query("SELECT * FROM quotation_templates WHERE id = $1;", [template_id]);
    if (tmplRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Template not found.", 404);
    }
    const template = tmplRes.rows[0];

    let linesToProcess = custom_lines;
    if (!linesToProcess) {
      const tmplLines = await client.query("SELECT * FROM quotation_template_lines WHERE template_id = $1;", [template_id]);
      linesToProcess = tmplLines.rows;
    }

    const validityDays = template.validity_days || 30;
    const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Delegate to line calculation
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const computedLines = [];
    for (const item of linesToProcess) {
      const prodRes = await client.query("SELECT name, sales_price FROM products WHERE id = $1", [item.product_id]);
      if (prodRes.rows.length === 0) continue;

      let variantName = null;
      let extra = 0;
      if (item.variant_id) {
        const vRes = await client.query("SELECT attribute_value, price_extra FROM product_variants WHERE id = $1", [item.variant_id]);
        if (vRes.rows.length > 0) {
          variantName = vRes.rows[0].attribute_value;
          extra = parseFloat(vRes.rows[0].price_extra) || 0;
        }
      }

      const unitPrice = item.unit_price !== undefined && item.unit_price !== null
        ? parseFloat(item.unit_price)
        : (parseFloat(prodRes.rows[0].sales_price) + extra);

      const quantity = parseInt(item.quantity) || 1;
      const lineSubtotal = quantity * unitPrice;

      let taxRate = 0;
      if (item.tax_rule_id) {
        const taxRes = await client.query("SELECT rate FROM tax_rules WHERE id = $1", [item.tax_rule_id]);
        if (taxRes.rows.length > 0) taxRate = parseFloat(taxRes.rows[0].rate);
      }

      const lineDiscount = parseFloat(item.discount_amount) || 0;
      const lineTax = Math.round(((lineSubtotal - lineDiscount) * (taxRate / 100)) * 100) / 100;
      const lineTotal = lineSubtotal - lineDiscount + lineTax;

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;

      computedLines.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: prodRes.rows[0].name,
        variant_name: variantName,
        description: item.description || prodRes.rows[0].name,
        quantity,
        unit_price: unitPrice,
        line_subtotal: lineSubtotal,
        tax_rule_id: item.tax_rule_id || null,
        tax_rate_snapshot: taxRate,
        tax_amount: lineTax,
        discount_amount: lineDiscount,
        line_total: lineTotal
      });
    }

    const totalAmount = subtotal - discountTotal + taxTotal;

    const quoteRes = await client.query(
      `INSERT INTO quotations (
        customer_id, plan_id, template_id, status, valid_until,
        payment_terms, subtotal, tax_total, discount_total, total_amount,
        terms_and_conditions
      )
      VALUES ($1, $2, $3, 'draft', $4, 'Net 30', $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        customer_id, template.plan_id, template.id, validUntil,
        subtotal, taxTotal, discountTotal, totalAmount, template.terms_and_conditions
      ]
    );
    const quotation = quoteRes.rows[0];

    for (const cl of computedLines) {
      await client.query(
        `INSERT INTO quotation_lines (
          quotation_id, product_id, variant_id, product_name, variant_name, description,
          quantity, unit_price, line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount,
          discount_amount, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        [
          quotation.id, cl.product_id, cl.variant_id, cl.product_name, cl.variant_name, cl.description,
          cl.quantity, cl.unit_price, cl.line_subtotal, cl.tax_rule_id, cl.tax_rate_snapshot, cl.tax_amount,
          cl.discount_amount, cl.line_total
        ]
      );
    }

    await client.query("COMMIT;");
    return successResponse(res, quotation, `Quotation instantiated from template '${template.name}'.`, 201);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to create quotation from template: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const sendQuotation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE quotations SET status = 'quotation' WHERE id = $1 RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Quotation not found.", 404);
    }

    return successResponse(res, result.rows[0], "Quotation marked as sent.");
  } catch (err) {
    return errorResponse(res, "Failed to send quotation: " + err.message, 500);
  }
};

export const cancelQuotation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE quotations SET status = 'cancelled' WHERE id = $1 RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Quotation not found.", 404);
    }

    return successResponse(res, result.rows[0], "Quotation cancelled.");
  } catch (err) {
    return errorResponse(res, "Failed to cancel quotation: " + err.message, 500);
  }
};

export const confirmQuotation = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const qRes = await client.query("SELECT * FROM quotations WHERE id = $1 FOR UPDATE;", [id]);
    if (qRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Quotation not found.", 404);
    }

    const quote = qRes.rows[0];
    if (quote.status === "confirmed") {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Quotation is already confirmed.", 400);
    }

    // 1. Mark quote confirmed
    const updRes = await client.query(
      "UPDATE quotations SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1 RETURNING *;",
      [id]
    );
    const quotation = updRes.rows[0];

    // 2. Fetch plan to determine billing cadence
    const planRes = await client.query("SELECT * FROM plans WHERE id = $1", [quote.plan_id]);
    const plan = planRes.rows[0];

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(startDate.getFullYear() + 1); // 1-year contract default

    const nextBillingDate = new Date();
    if (plan.billing_frequency === "daily") nextBillingDate.setDate(startDate.getDate() + 1);
    else if (plan.billing_frequency === "weekly") nextBillingDate.setDate(startDate.getDate() + 7);
    else if (plan.billing_frequency === "monthly") nextBillingDate.setMonth(startDate.getMonth() + 1);
    else if (plan.billing_frequency === "yearly") nextBillingDate.setFullYear(startDate.getFullYear() + 1);

    // 3. Create Subscription
    const subRes = await client.query(
      `INSERT INTO subscriptions (
        customer_id, plan_id, quotation_id, template_id, status, payment_terms,
        currency, start_date, expiry_date, next_billing_date,
        subtotal, tax_amount, discount_amount, total_amount, notes
      )
      VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;`,
      [
        quote.customer_id, quote.plan_id, quote.id, quote.template_id,
        quote.payment_terms || "Immediate", quote.currency,
        startDate.toISOString().split("T")[0],
        expiryDate.toISOString().split("T")[0],
        nextBillingDate.toISOString().split("T")[0],
        quote.subtotal, quote.tax_total, quote.discount_total, quote.total_amount,
        "Generated automatically upon confirmation of quote #" + quote.quotation_number
      ]
    );
    const subscription = subRes.rows[0];

    // 4. Copy quotation lines to subscription lines
    const qLines = await client.query("SELECT * FROM quotation_lines WHERE quotation_id = $1", [id]);
    for (const ql of qLines.rows) {
      await client.query(
        `INSERT INTO subscription_lines (
          subscription_id, product_id, variant_id, product_name, variant_name, description,
          quantity, unit_price, line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount,
          discount_amount, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        [
          subscription.id, ql.product_id, ql.variant_id, ql.product_name, ql.variant_name, ql.description,
          ql.quantity, ql.unit_price, ql.line_subtotal, ql.tax_rule_id, ql.tax_rate_snapshot, ql.tax_amount,
          ql.discount_amount, ql.line_total
        ]
      );
    }

    // 5. Log subscription created event
    await client.query(
      `INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes)
       VALUES ($1, 'confirmed', 'quotation', 'active', 'Converted from Quotation', $2);`,
      [subscription.id, "Quote #" + quote.quotation_number + " confirmed."]
    );

    await client.query("COMMIT;");
    return successResponse(res, { quotation, subscription }, "Quotation confirmed and converted to subscription contract.", 200);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to confirm quotation: " + err.message, 500);
  } finally {
    client.release();
  }
};
