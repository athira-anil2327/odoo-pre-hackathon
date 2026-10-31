import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getPayments = async (req, res) => {
  const { invoice_id, customer_id } = req.query;

  try {
    let query = `
      SELECT 
        p.*,
        i.invoice_number,
        i.total_amount AS invoice_total,
        i.outstanding_amount AS invoice_balance,
        c.customer_number,
        c.name AS customer_name,
        c.company AS customer_company
      FROM payments p
      JOIN invoices i ON i.id = p.invoice_id
      JOIN customers c ON c.id = i.customer_id
    `;
    const params = [];
    const conditions = [];

    if (invoice_id) {
      params.push(invoice_id);
      conditions.push(`p.invoice_id = $${params.length}`);
    }

    if (customer_id) {
      params.push(customer_id);
      conditions.push(`i.customer_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY p.payment_date DESC, p.created_at DESC;";

    const result = await pool.query(query, params);
    return successResponse(res, result.rows, "Payments retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve payments: " + err.message, 500);
  }
};

export const recordPayment = async (req, res) => {
  const {
    invoice_id,
    payment_method,
    amount,
    currency = "INR",
    payment_date,
    note,
    reference_number,
    idempotency_key
  } = req.body;

  if (!invoice_id || !payment_method || !amount) {
    return errorResponse(res, "invoice_id, payment_method, and amount are required.", 400);
  }

  const payAmount = parseFloat(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return errorResponse(res, "Payment amount must be greater than 0.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    // Lock invoice FOR UPDATE to prevent race conditions during concurrent settlements
    const invRes = await client.query(
      "SELECT * FROM invoices WHERE id = $1 FOR UPDATE;",
      [invoice_id]
    );

    if (invRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Invoice not found.", 404);
    }

    const invoice = invRes.rows[0];

    if (invoice.status === "cancelled") {
      await client.query("ROLLBACK;");
      return errorResponse(res, "Cannot record payment on a cancelled invoice.", 400);
    }

    const outstanding = parseFloat(invoice.outstanding_amount);
    if (payAmount > outstanding) {
      await client.query("ROLLBACK;");
      return errorResponse(res, `Payment amount (₹${payAmount}) exceeds invoice outstanding balance (₹${outstanding}).`, 400);
    }

    // Insert payment
    const paymentRes = await client.query(
      `INSERT INTO payments (
        invoice_id, payment_method, amount, currency, payment_date,
        note, reference_number, idempotency_key, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        invoice_id, payment_method, payAmount, currency,
        payment_date || new Date().toISOString().split("T")[0],
        note || null, reference_number || null, idempotency_key || null,
        req.user?.id || null
      ]
    );
    const payment = paymentRes.rows[0];

    // Compute updated balances
    const newPaid = parseFloat(invoice.paid_amount) + payAmount;
    const newOutstanding = Math.max(0, parseFloat(invoice.total_amount) - newPaid);
    const newStatus = newOutstanding <= 0.001 ? "paid" : "partially_paid";

    const updatedInv = await client.query(
      `UPDATE invoices 
       SET paid_amount = $1, outstanding_amount = $2, status = $3
       WHERE id = $4
       RETURNING *;`,
      [newPaid, newOutstanding, newStatus, invoice_id]
    );

    await client.query("COMMIT;");
    return successResponse(
      res,
      { payment, invoice: updatedInv.rows[0] },
      `Payment of ₹${payAmount} applied successfully. Invoice balance is now ₹${newOutstanding}.`,
      201
    );
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to apply payment: " + err.message, 500);
  } finally {
    client.release();
  }
};
