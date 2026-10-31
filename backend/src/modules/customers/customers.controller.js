import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getCustomers = async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT 
        c.id,
        c.customer_number,
        c.name,
        c.email,
        c.phone,
        c.company,
        c.billing_address,
        c.tax_id,
        c.currency,
        c.is_active,
        c.created_at,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS active_subscriptions_count,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'active'), 0) AS total_mrr
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id
    `;
    const params = [];

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` WHERE lower(c.name) LIKE lower($1) OR lower(c.company) LIKE lower($1) OR lower(c.email) LIKE lower($1) `;
    }

    query += `
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    return successResponse(res, result.rows, "Customers retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve customers: " + err.message, 500);
  }
};

export const getCustomerById = async (req, res) => {
  const { id } = req.params;

  try {
    const custRes = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );

    if (custRes.rows.length === 0) {
      return errorResponse(res, "Customer not found.", 404);
    }

    const customer = custRes.rows[0];

    // Fetch customer's subscriptions
    const subRes = await pool.query(
      `SELECT s.id, s.subscription_number, p.name AS plan_name, s.status, s.total_amount, s.next_billing_date
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.customer_id = $1
       ORDER BY s.created_at DESC`,
      [id]
    );

    // Fetch customer's invoices
    const invRes = await pool.query(
      `SELECT id, invoice_number, total_amount, paid_amount, outstanding_amount, status, due_date, invoice_date
       FROM invoices
       WHERE customer_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    return successResponse(res, {
      ...customer,
      subscriptions: subRes.rows,
      invoices: invRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve customer: " + err.message, 500);
  }
};

export const createCustomer = async (req, res) => {
  const { name, email, phone, company, billing_address, tax_id, currency = "INR" } = req.body;

  if (!name || !email) {
    return errorResponse(res, "Customer name and email are required.", 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, company, billing_address, tax_id, currency, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [name.trim(), email.trim(), phone || null, company || null, billing_address || null, tax_id || null, currency, req.user?.id || null]
    );

    return successResponse(res, result.rows[0], "Customer created successfully.", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create customer: " + err.message, 500);
  }
};

export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, company, billing_address, tax_id, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE customers
       SET 
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         company = COALESCE($4, company),
         billing_address = COALESCE($5, billing_address),
         tax_id = COALESCE($6, tax_id),
         is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *;`,
      [name, email, phone, company, billing_address, tax_id, is_active, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Customer not found.", 404);
    }

    return successResponse(res, result.rows[0], "Customer updated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to update customer: " + err.message, 500);
  }
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE customers SET is_active = FALSE WHERE id = $1 RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Customer not found.", 404);
    }

    return successResponse(res, result.rows[0], "Customer deactivated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to delete customer: " + err.message, 500);
  }
};
