import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getDiscounts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, p.name AS product_name
       FROM discounts d
       LEFT JOIN products p ON p.id = d.product_id
       ORDER BY d.created_at DESC;`
    );
    return successResponse(res, result.rows, "Discounts retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve discounts: " + err.message, 500);
  }
};

export const createDiscount = async (req, res) => {
  const {
    code,
    name,
    description,
    discount_type,
    amount,
    scope = "whole_subscription",
    product_id,
    min_order_amount = 0,
    min_quantity = 0,
    max_discount_amount,
    start_date,
    end_date,
    max_uses
  } = req.body;

  if (!code || !name || !discount_type || !amount) {
    return errorResponse(res, "code, name, discount_type, and amount are required.", 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO discounts (
        code, name, description, discount_type, amount, scope, product_id,
        min_order_amount, min_quantity, max_discount_amount, start_date, end_date, max_uses
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;`,
      [
        code.trim().toUpperCase(), name.trim(), description || null, discount_type,
        parseFloat(amount), scope, product_id || null,
        parseFloat(min_order_amount) || 0, parseInt(min_quantity) || 0,
        max_discount_amount ? parseFloat(max_discount_amount) : null,
        start_date || null, end_date || null,
        max_uses ? parseInt(max_uses) : null
      ]
    );

    return successResponse(res, result.rows[0], "Discount coupon created successfully.", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create discount: " + err.message, 500);
  }
};

export const validateDiscount = async (req, res) => {
  const { code, subtotal = 0, quantity = 1, product_id } = req.body;

  if (!code) {
    return errorResponse(res, "Coupon code is required.", 400);
  }

  try {
    const result = await pool.query(
      `SELECT * FROM discounts 
       WHERE code = $1 AND is_active = TRUE;`,
      [code.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Invalid or inactive discount code.", 404);
    }

    const d = result.rows[0];
    const now = new Date().toISOString().split("T")[0];

    if (d.start_date && d.start_date > now) {
      return errorResponse(res, "This discount promotion has not started yet.", 400);
    }

    if (d.end_date && d.end_date < now) {
      return errorResponse(res, "This discount coupon has expired.", 400);
    }

    if (d.max_uses && d.times_used >= d.max_uses) {
      return errorResponse(res, "This discount code has reached its maximum usage limit.", 400);
    }

    if (subtotal < parseFloat(d.min_order_amount)) {
      return errorResponse(res, `Minimum purchase of ₹${d.min_order_amount} required to use this coupon.`, 400);
    }

    if (quantity < d.min_quantity) {
      return errorResponse(res, `Minimum quantity of ${d.min_quantity} required for this coupon.`, 400);
    }

    let calculatedDiscount = 0;
    if (d.discount_type === "percentage") {
      calculatedDiscount = (parseFloat(subtotal) * parseFloat(d.amount)) / 100;
      if (d.max_discount_amount) {
        calculatedDiscount = Math.min(calculatedDiscount, parseFloat(d.max_discount_amount));
      }
    } else {
      calculatedDiscount = Math.min(parseFloat(d.amount), parseFloat(subtotal));
    }

    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return successResponse(res, {
      discount_id: d.id,
      code: d.code,
      name: d.name,
      discount_type: d.discount_type,
      discount_amount: calculatedDiscount,
      effective_total: Math.max(0, subtotal - calculatedDiscount)
    }, "Discount code is valid.");
  } catch (err) {
    return errorResponse(res, "Failed to validate coupon: " + err.message, 500);
  }
};
