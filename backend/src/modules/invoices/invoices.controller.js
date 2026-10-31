import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getInvoices = async (req, res) => {
  const { status, customer_id, overdue } = req.query;

  try {
    let query = `
      SELECT 
        i.*,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        s.subscription_number,
        (CURRENT_DATE - i.due_date) AS days_overdue
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN subscriptions s ON s.id = i.subscription_id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status.toLowerCase());
      conditions.push(`i.status = $${params.length}`);
    }

    if (customer_id) {
      params.push(customer_id);
      conditions.push(`i.customer_id = $${params.length}`);
    }

    if (overdue === "true") {
      conditions.push(`i.status IN ('confirmed', 'partially_paid') AND i.outstanding_amount > 0 AND i.due_date < CURRENT_DATE`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY i.created_at DESC;";

    const result = await pool.query(query, params);
    return successResponse(res, result.rows, "Invoices retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve invoices: " + err.message, 500);
  }
};

export const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const invRes = await pool.query(`
      SELECT 
        i.*,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        c.billing_address,
        c.tax_id AS customer_tax_id,
        s.subscription_number,
        (CURRENT_DATE - i.due_date) AS days_overdue
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN subscriptions s ON s.id = i.subscription_id
      WHERE i.id = $1;
    `, [id]);

    if (invRes.rows.length === 0) {
      return errorResponse(res, "Invoice not found.", 404);
    }

    const linesRes = await pool.query(
      "SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY created_at ASC;",
      [id]
    );

    const paymentsRes = await pool.query(
      "SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC, created_at DESC;",
      [id]
    );

    return successResponse(res, {
      ...invRes.rows[0],
      lines: linesRes.rows,
      payments: paymentsRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve invoice: " + err.message, 500);
  }
};

export const createInvoice = async (req, res) => {
  const {
    subscription_id,
    customer_id,
    billing_period_start,
    billing_period_end,
    due_date,
    currency = "INR",
    lines = [],
    notes
  } = req.body;

  if (!subscription_id || !customer_id || !billing_period_start || !billing_period_end) {
    return errorResponse(res, "subscription_id, customer_id, billing_period_start, and billing_period_end are required.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    // Check duplicate guard
    const existingInv = await client.query(
      "SELECT * FROM invoices WHERE subscription_id = $1 AND billing_period_start = $2;",
      [subscription_id, billing_period_start]
    );
    if (existingInv.rows.length > 0) {
      await client.query("ROLLBACK;");
      return successResponse(res, existingInv.rows[0], "Invoice already exists for this billing period.");
    }

    let linesToProcess = lines;
    if (!linesToProcess || linesToProcess.length === 0) {
      const subLinesRes = await client.query("SELECT * FROM subscription_lines WHERE subscription_id = $1;", [subscription_id]);
      linesToProcess = subLinesRes.rows;
    }

    if (!linesToProcess || linesToProcess.length === 0) {
      const defProdRes = await client.query("SELECT id, name, sales_price FROM products LIMIT 1;");
      if (defProdRes.rows.length > 0) {
        linesToProcess = [{
          product_id: defProdRes.rows[0].id,
          unit_price: parseFloat(defProdRes.rows[0].sales_price) || 499.00,
          quantity: 1,
          description: "Subscription recurring billing service"
        }];
      }
    }

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

      const unitPrice = item.unit_price !== undefined ? parseFloat(item.unit_price) : (parseFloat(prodRes.rows[0].sales_price) + extra);
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
        period_start: billing_period_start,
        period_end: billing_period_end,
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
    const invDueDate = due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const invRes = await client.query(
      `INSERT INTO invoices (
        subscription_id, customer_id, billing_period_start, billing_period_end,
        due_date, currency, subtotal, tax_total, discount_total, total_amount,
        paid_amount, outstanding_amount, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $10, 'confirmed', $11)
      RETURNING *;`,
      [
        subscription_id, customer_id, billing_period_start, billing_period_end,
        invDueDate, currency, subtotal, taxTotal, discountTotal, totalAmount,
        notes || null
      ]
    );
    const invoice = invRes.rows[0];

    for (const cl of computedLines) {
      await client.query(
        `INSERT INTO invoice_lines (
          invoice_id, product_id, variant_id, product_name, variant_name, description,
          period_start, period_end, quantity, unit_price, line_subtotal,
          tax_rule_id, tax_rate_snapshot, tax_amount, discount_amount, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);`,
        [
          invoice.id, cl.product_id, cl.variant_id, cl.product_name, cl.variant_name, cl.description,
          cl.period_start, cl.period_end, cl.quantity, cl.unit_price, cl.line_subtotal,
          cl.tax_rule_id, cl.tax_rate_snapshot, cl.tax_amount, cl.discount_amount, cl.line_total
        ]
      );
    }

    await client.query("COMMIT;");
    return successResponse(res, invoice, "Invoice created successfully.", 201);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to create invoice: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const generateBillingCycleInvoices = async (req, res) => {
  const client = await pool.connect();
  const generatedInvoices = [];
  const errors = [];

  try {
    await client.query("BEGIN;");

    // Select active subscriptions due for billing
    const dueSubs = await client.query(`
      SELECT s.*, p.billing_frequency
      FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      JOIN customers c ON c.id = s.customer_id
      WHERE s.status = 'active'
        AND s.next_billing_date <= CURRENT_DATE
      FOR UPDATE;
    `);

    for (const sub of dueSubs.rows) {
      try {
        const periodStart = sub.next_billing_date || new Date().toISOString().split("T")[0];
        
        // Calculate period end and next billing date based on frequency
        const pStartDate = new Date(periodStart);
        const pEndDate = new Date(periodStart);
        const nextBilling = new Date(periodStart);

        if (sub.billing_frequency === "daily") {
          pEndDate.setDate(pStartDate.getDate() + 1);
          nextBilling.setDate(pStartDate.getDate() + 1);
        } else if (sub.billing_frequency === "weekly") {
          pEndDate.setDate(pStartDate.getDate() + 7);
          nextBilling.setDate(pStartDate.getDate() + 7);
        } else if (sub.billing_frequency === "monthly") {
          pEndDate.setMonth(pStartDate.getMonth() + 1);
          nextBilling.setMonth(pStartDate.getMonth() + 1);
        } else if (sub.billing_frequency === "yearly") {
          pEndDate.setFullYear(pStartDate.getFullYear() + 1);
          nextBilling.setFullYear(pStartDate.getFullYear() + 1);
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // Net 30 default

        // Create Invoice
        const invRes = await client.query(`
          INSERT INTO invoices (
            subscription_id, customer_id, billing_period_start, billing_period_end,
            invoice_date, due_date, currency, subtotal, tax_total, discount_total,
            total_amount, paid_amount, outstanding_amount, status
          )
          VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, $10, 0, $10, 'confirmed')
          ON CONFLICT (subscription_id, billing_period_start) DO NOTHING
          RETURNING *;
        `, [
          sub.id, sub.customer_id, periodStart,
          pEndDate.toISOString().split("T")[0],
          dueDate.toISOString().split("T")[0],
          sub.currency, sub.subtotal, sub.tax_amount, sub.discount_amount, sub.total_amount
        ]);

        if (invRes.rows.length === 0) {
          // Already generated (idempotent duplicate guard)
          continue;
        }

        const newInvoice = invRes.rows[0];

        // Copy subscription lines to invoice lines
        const subLines = await client.query(
          "SELECT * FROM subscription_lines WHERE subscription_id = $1;",
          [sub.id]
        );

        for (const sl of subLines.rows) {
          await client.query(`
            INSERT INTO invoice_lines (
              invoice_id, product_id, variant_id, product_name, variant_name, description,
              period_start, period_end, quantity, unit_price, line_subtotal,
              tax_rule_id, tax_rate_snapshot, tax_amount, discount_amount, line_total
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
          `, [
            newInvoice.id, sl.product_id, sl.variant_id, sl.product_name, sl.variant_name, sl.description,
            periodStart, pEndDate.toISOString().split("T")[0],
            sl.quantity, sl.unit_price, sl.line_subtotal,
            sl.tax_rule_id, sl.tax_rate_snapshot, sl.tax_amount, sl.discount_amount, sl.line_total
          ]);
        }

        // Advance subscription next_billing_date
        await client.query(
          "UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2;",
          [nextBilling.toISOString().split("T")[0], sub.id]
        );

        generatedInvoices.push(newInvoice);
      } catch (subErr) {
        errors.push({ subscription_id: sub.id, error: subErr.message });
      }
    }

    await client.query("COMMIT;");
    return successResponse(
      res,
      { count: generatedInvoices.length, invoices: generatedInvoices, errors },
      `Recurring billing cycle executed. ${generatedInvoices.length} invoices generated.`
    );
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to run billing cycle: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const confirmInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE invoices SET status = 'confirmed' WHERE id = $1 AND status = 'draft' RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Invoice not found or not in draft state.", 400);
    }

    return successResponse(res, result.rows[0], "Invoice confirmed.");
  } catch (err) {
    return errorResponse(res, "Failed to confirm invoice: " + err.message, 500);
  }
};

export const cancelInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE invoices SET status = 'cancelled' WHERE id = $1 RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Invoice not found.", 404);
    }

    return successResponse(res, result.rows[0], "Invoice cancelled.");
  } catch (err) {
    return errorResponse(res, "Failed to cancel invoice: " + err.message, 500);
  }
};
