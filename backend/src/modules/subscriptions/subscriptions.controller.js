import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getSubscriptions = async (req, res) => {
  const { status, customer_id } = req.query;

  try {
    let query = `
      SELECT 
        s.*,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        p.name AS plan_name,
        p.billing_frequency,
        u.name AS staff_name
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN plans p ON p.id = s.plan_id
      LEFT JOIN users u ON u.id = s.assigned_staff_id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status.toLowerCase());
      conditions.push(`s.status = $${params.length}`);
    }

    if (customer_id) {
      params.push(customer_id);
      conditions.push(`s.customer_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY s.created_at DESC;";

    const result = await pool.query(query, params);
    return successResponse(res, result.rows, "Subscriptions retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve subscriptions: " + err.message, 500);
  }
};

export const getSubscriptionById = async (req, res) => {
  const { id } = req.params;

  try {
    const subRes = await pool.query(`
      SELECT 
        s.*,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        c.billing_address,
        p.name AS plan_name,
        p.billing_frequency,
        p.allow_pause,
        p.allow_early_close,
        p.allow_renewal,
        u.name AS staff_name
      FROM subscriptions s
      JOIN customers c ON c.id = s.customer_id
      JOIN plans p ON p.id = s.plan_id
      LEFT JOIN users u ON u.id = s.assigned_staff_id
      WHERE s.id = $1;
    `, [id]);

    if (subRes.rows.length === 0) {
      return errorResponse(res, "Subscription not found.", 404);
    }

    const linesRes = await pool.query(`
      SELECT sl.*, pr.name AS catalog_product_name
      FROM subscription_lines sl
      JOIN products pr ON pr.id = sl.product_id
      WHERE sl.subscription_id = $1
      ORDER BY sl.created_at ASC;
    `, [id]);

    const eventsRes = await pool.query(`
      SELECT se.*, u.name AS performed_by_name
      FROM subscription_events se
      LEFT JOIN users u ON u.id = se.performed_by
      WHERE se.subscription_id = $1
      ORDER BY se.event_date DESC;
    `, [id]);

    return successResponse(res, {
      ...subRes.rows[0],
      lines: linesRes.rows,
      events: eventsRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve subscription: " + err.message, 500);
  }
};

export const createSubscription = async (req, res) => {
  const {
    customer_id,
    plan_id,
    start_date = new Date().toISOString().split("T")[0],
    expiry_date,
    payment_terms = "Net 30",
    currency = "INR",
    notes,
    lines = []
  } = req.body;

  if (!customer_id || !plan_id) {
    return errorResponse(res, "customer_id and plan_id are required.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    // Fetch plan details to calculate next_billing_date
    const planRes = await client.query("SELECT * FROM plans WHERE id = $1", [plan_id]);
    if (planRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Plan not found.", 404);
    }
    const plan = planRes.rows[0];

    const sDate = new Date(start_date);
    const nextBilling = new Date(start_date);
    if (plan.billing_frequency === "daily") nextBilling.setDate(sDate.getDate() + 1);
    else if (plan.billing_frequency === "weekly") nextBilling.setDate(sDate.getDate() + 7);
    else if (plan.billing_frequency === "monthly") nextBilling.setMonth(sDate.getMonth() + 1);
    else if (plan.billing_frequency === "yearly") nextBilling.setFullYear(sDate.getFullYear() + 1);

    const expDate = expiry_date ? new Date(expiry_date) : new Date(new Date(start_date).setFullYear(sDate.getFullYear() + 1));

    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

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
      const lineTax = Math.round(((lineSubtotal - lineDiscount) * (taxRate / 100)) * 100) / 100;
      const lineTotal = lineSubtotal - lineDiscount + lineTax;

      subtotal += lineSubtotal;
      discountAmount += lineDiscount;
      taxAmount += lineTax;

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

    // If no lines were supplied, use plan's base price
    if (computedLines.length === 0) {
      subtotal = parseFloat(plan.price);
    }
    const totalAmount = subtotal - discountAmount + taxAmount;

    const subRes = await client.query(
      `INSERT INTO subscriptions (
        customer_id, plan_id, status, payment_terms, currency,
        start_date, expiry_date, next_billing_date,
        subtotal, tax_amount, discount_amount, total_amount, notes, created_by
      )
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;`,
      [
        customer_id, plan_id, payment_terms, currency,
        start_date, expDate.toISOString().split("T")[0], nextBilling.toISOString().split("T")[0],
        subtotal, taxAmount, discountAmount, totalAmount, notes || null, req.user?.id || null
      ]
    );
    const subscription = subRes.rows[0];

    for (const cl of computedLines) {
      await client.query(
        `INSERT INTO subscription_lines (
          subscription_id, product_id, variant_id, product_name, variant_name, description,
          quantity, unit_price, line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount,
          discount_amount, line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        [
          subscription.id, cl.product_id, cl.variant_id, cl.product_name, cl.variant_name, cl.description,
          cl.quantity, cl.unit_price, cl.line_subtotal, cl.tax_rule_id, cl.tax_rate_snapshot, cl.tax_amount,
          cl.discount_amount, cl.line_total
        ]
      );
    }

    await client.query(
      `INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes, performed_by)
       VALUES ($1, 'created', 'draft', 'active', 'Direct contract creation', 'Contract initiated.', $2);`,
      [subscription.id, req.user?.id || null]
    );

    await client.query("COMMIT;");
    return successResponse(res, subscription, "Subscription created successfully.", 201);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to create subscription: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const pauseSubscription = async (req, res) => {
  const { id } = req.params;
  const { reason = "Requested by customer" } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const subRes = await client.query("SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE;", [id]);
    if (subRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Subscription not found.", 404);
    }

    const sub = subRes.rows[0];
    if (sub.status !== "active") {
      await client.query("ROLLBACK;");
      return errorResponse(res, `Cannot pause subscription in '${sub.status}' state. Must be 'active'.`, 400);
    }

    const updateRes = await client.query(
      `UPDATE subscriptions 
       SET status = 'paused', paused_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id]
    );

    await client.query(
      `INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes, performed_by)
       VALUES ($1, 'paused', 'active', 'paused', $2, 'Subscription paused.', $3);`,
      [id, reason, req.user?.id || null]
    );

    await client.query("COMMIT;");
    return successResponse(res, updateRes.rows[0], "Subscription successfully paused.");
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to pause subscription: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const resumeSubscription = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const subRes = await client.query("SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE;", [id]);
    if (subRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Subscription not found.", 404);
    }

    const sub = subRes.rows[0];
    if (sub.status !== "paused") {
      await client.query("ROLLBACK;");
      return errorResponse(res, `Cannot resume subscription in '${sub.status}' state. Must be 'paused'.`, 400);
    }

    const updateRes = await client.query(
      `UPDATE subscriptions 
       SET status = 'active', paused_at = NULL
       WHERE id = $1
       RETURNING *;`,
      [id]
    );

    await client.query(
      `INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes, performed_by)
       VALUES ($1, 'resumed', 'paused', 'active', 'Service resumed', 'Subscription resumed and active.', $2);`,
      [id, req.user?.id || null]
    );

    await client.query("COMMIT;");
    return successResponse(res, updateRes.rows[0], "Subscription successfully resumed.");
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to resume subscription: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const closeSubscription = async (req, res) => {
  const { id } = req.params;
  const { reason = "Customer requested cancellation" } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const subRes = await client.query("SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE;", [id]);
    if (subRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Subscription not found.", 404);
    }

    const sub = subRes.rows[0];
    if (sub.status === "closed") {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Subscription is already closed.", 400);
    }

    const updateRes = await client.query(
      `UPDATE subscriptions 
       SET status = 'closed', closed_at = NOW(), closure_reason = $2
       WHERE id = $1
       RETURNING *;`,
      [id, reason]
    );

    await client.query(
      `INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes, performed_by)
       VALUES ($1, 'closed', $2, 'closed', $3, 'Subscription terminated.', $4);`,
      [id, sub.status, reason, req.user?.id || null]
    );

    await client.query("COMMIT;");
    return successResponse(res, updateRes.rows[0], "Subscription closed/cancelled successfully.");
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to close subscription: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const renewSubscription = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const subRes = await client.query(`
      SELECT s.*, p.billing_frequency 
      FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      WHERE s.id = $1 FOR UPDATE;
    `, [id]);

    if (subRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Subscription not found.", 404);
    }

    const sub = subRes.rows[0];
    const currNext = sub.next_billing_date ? new Date(sub.next_billing_date) : new Date();

    if (sub.billing_frequency === "daily") currNext.setDate(currNext.getDate() + 1);
    else if (sub.billing_frequency === "weekly") currNext.setDate(currNext.getDate() + 7);
    else if (sub.billing_frequency === "monthly") currNext.setMonth(currNext.getMonth() + 1);
    else if (sub.billing_frequency === "yearly") currNext.setFullYear(currNext.getFullYear() + 1);

    const updateRes = await client.query(
      `UPDATE subscriptions 
       SET next_billing_date = $2, status = 'active'
       WHERE id = $1
       RETURNING *;`,
      [id, currNext.toISOString().split("T")[0]]
    );

    await client.query(
      `INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes, performed_by)
       VALUES ($1, 'renewed', $2, 'active', 'Subscription renewed', 'Renewal cycle advanced.', $3);`,
      [id, sub.status, req.user?.id || null]
    );

    await client.query("COMMIT;");
    return successResponse(res, updateRes.rows[0], "Subscription renewed successfully.");
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to renew subscription: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const getSubscriptionEvents = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT se.*, u.name AS performed_by_name
       FROM subscription_events se
       LEFT JOIN users u ON u.id = se.performed_by
       WHERE se.subscription_id = $1
       ORDER BY se.event_date DESC;`,
      [id]
    );

    return successResponse(res, result.rows, "Subscription event history retrieved.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve events: " + err.message, 500);
  }
};
