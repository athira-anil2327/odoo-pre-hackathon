import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getPlans = async (req, res) => {
  try {
    const plansRes = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pp.id,
              'product_id', pr.id,
              'product_name', pr.name,
              'variant_id', pv.id,
              'variant_name', pv.attribute_value,
              'quantity', pp.quantity,
              'unit_price', pp.unit_price
            )
          ) FILTER (WHERE pp.id IS NOT NULL), '[]'::json
        ) AS included_products
      FROM plans p
      LEFT JOIN plan_products pp ON pp.plan_id = p.id
      LEFT JOIN products pr ON pr.id = pp.product_id
      LEFT JOIN product_variants pv ON pv.id = pp.variant_id
      GROUP BY p.id
      ORDER BY p.created_at ASC;
    `);

    return successResponse(res, plansRes.rows, "Subscription plans retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve plans: " + err.message, 500);
  }
};

export const getPlanById = async (req, res) => {
  const { id } = req.params;

  try {
    const planRes = await pool.query("SELECT * FROM plans WHERE id = $1", [id]);
    if (planRes.rows.length === 0) {
      return errorResponse(res, "Plan not found.", 404);
    }

    const itemsRes = await pool.query(`
      SELECT pp.*, pr.name AS product_name, pv.attribute_value AS variant_name
      FROM plan_products pp
      JOIN products pr ON pr.id = pp.product_id
      LEFT JOIN product_variants pv ON pv.id = pp.variant_id
      WHERE pp.plan_id = $1;
    `, [id]);

    return successResponse(res, {
      ...planRes.rows[0],
      included_products: itemsRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve plan: " + err.message, 500);
  }
};

export const createPlan = async (req, res) => {
  const {
    code,
    name,
    description,
    billing_frequency = "monthly",
    price = 0,
    min_quantity = 1,
    start_date,
    end_date,
    auto_close_on_end = false,
    allow_early_close = true,
    allow_pause = true,
    allow_renewal = true,
    products = []
  } = req.body;

  if (!name) {
    return errorResponse(res, "Plan name is required.", 400);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const planCode = code || "PLAN-" + Date.now().toString(36).toUpperCase();

    const planRes = await client.query(
      `INSERT INTO plans (
        code, name, description, billing_frequency, price, min_quantity,
        start_date, end_date, auto_close_on_end, allow_early_close, allow_pause, allow_renewal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;`,
      [
        planCode, name.trim(), description || null, billing_frequency,
        parseFloat(price) || 0, parseInt(min_quantity) || 1,
        start_date || null, end_date || null,
        Boolean(auto_close_on_end), Boolean(allow_early_close),
        Boolean(allow_pause), Boolean(allow_renewal)
      ]
    );

    const plan = planRes.rows[0];

    // Insert included products if provided
    for (const item of products) {
      await client.query(
        `INSERT INTO plan_products (plan_id, product_id, variant_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5);`,
        [plan.id, item.product_id, item.variant_id || null, item.quantity || 1, item.unit_price || null]
      );
    }

    await client.query("COMMIT;");
    return successResponse(res, plan, "Subscription plan created successfully.", 201);
  } catch (err) {
    await client.query("ROLLBACK;");
    return errorResponse(res, "Failed to create plan: " + err.message, 500);
  } finally {
    client.release();
  }
};

export const updatePlan = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    billing_frequency,
    price,
    min_quantity,
    start_date,
    end_date,
    auto_close_on_end,
    allow_early_close,
    allow_pause,
    allow_renewal,
    is_active
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE plans
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         billing_frequency = COALESCE($3, billing_frequency),
         price = COALESCE($4, price),
         min_quantity = COALESCE($5, min_quantity),
         start_date = COALESCE($6, start_date),
         end_date = COALESCE($7, end_date),
         auto_close_on_end = COALESCE($8, auto_close_on_end),
         allow_early_close = COALESCE($9, allow_early_close),
         allow_pause = COALESCE($10, allow_pause),
         allow_renewal = COALESCE($11, allow_renewal),
         is_active = COALESCE($12, is_active)
       WHERE id = $13
       RETURNING *;`,
      [
        name,
        description,
        billing_frequency,
        price !== undefined ? parseFloat(price) : null,
        min_quantity !== undefined ? parseInt(min_quantity) : null,
        start_date,
        end_date,
        auto_close_on_end,
        allow_early_close,
        allow_pause,
        allow_renewal,
        is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Plan not found.", 404);
    }

    return successResponse(res, result.rows[0], "Plan updated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to update plan: " + err.message, 500);
  }
};

export const deletePlan = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE plans SET is_active = FALSE WHERE id = $1 RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Plan not found.", 404);
    }

    return successResponse(res, result.rows[0], "Plan deactivated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to delete plan: " + err.message, 500);
  }
};
