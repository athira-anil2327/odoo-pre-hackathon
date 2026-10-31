import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getTaxes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tax_rules WHERE is_active = TRUE ORDER BY rate DESC;"
    );
    return successResponse(res, result.rows, "Tax rules retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve tax rules: " + err.message, 500);
  }
};

export const createTax = async (req, res) => {
  const { name, tax_code, rate, application_type = "exclusive", country_code, state_region } = req.body;

  if (!name || rate === undefined) {
    return errorResponse(res, "Tax name and rate are required.", 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO tax_rules (name, tax_code, rate, application_type, country_code, state_region)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [name.trim(), tax_code || null, parseFloat(rate), application_type, country_code || null, state_region || null]
    );

    return successResponse(res, result.rows[0], "Tax rule created successfully.", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create tax rule: " + err.message, 500);
  }
};
