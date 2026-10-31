import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getProducts = async (req, res) => {
  try {
    const productsRes = await pool.query(`
      SELECT 
        p.id,
        p.code,
        p.name,
        p.type,
        p.sales_price,
        p.cost_price,
        p.notes,
        p.is_active,
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'attribute_name', v.attribute_name,
              'attribute_value', v.attribute_value,
              'price_extra', v.price_extra,
              'sku', v.sku,
              'is_active', v.is_active
            )
          ) FILTER (WHERE v.id IS NOT NULL), '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at ASC;
    `);

    return successResponse(res, productsRes.rows, "Products retrieved successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve products: " + err.message, 500);
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const productRes = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (productRes.rows.length === 0) {
      return errorResponse(res, "Product not found.", 404);
    }

    const variantsRes = await pool.query(
      "SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC",
      [id]
    );

    return successResponse(res, {
      ...productRes.rows[0],
      variants: variantsRes.rows
    });
  } catch (err) {
    return errorResponse(res, "Failed to retrieve product: " + err.message, 500);
  }
};

export const createProduct = async (req, res) => {
  const { name, code, type = "software", sales_price = 0, cost_price = 0, notes } = req.body;

  if (!name) {
    return errorResponse(res, "Product name is required.", 400);
  }

  try {
    const prodCode = code || "PROD-" + Date.now().toString(36).toUpperCase();

    const result = await pool.query(
      `INSERT INTO products (code, name, type, sales_price, cost_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [prodCode, name.trim(), type, parseFloat(sales_price) || 0, parseFloat(cost_price) || 0, notes || null]
    );

    return successResponse(res, result.rows[0], "Product created successfully.", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create product: " + err.message, 500);
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, sales_price, cost_price, notes, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET
         name = COALESCE($1, name),
         sales_price = COALESCE($2, sales_price),
         cost_price = COALESCE($3, cost_price),
         notes = COALESCE($4, notes),
         is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *;`,
      [
        name,
        sales_price !== undefined ? parseFloat(sales_price) : null,
        cost_price !== undefined ? parseFloat(cost_price) : null,
        notes,
        is_active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Product not found.", 404);
    }

    return successResponse(res, result.rows[0], "Product updated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to update product: " + err.message, 500);
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING *;",
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Product not found.", 404);
    }

    return successResponse(res, result.rows[0], "Product deactivated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to delete product: " + err.message, 500);
  }
};

export const addVariant = async (req, res) => {
  const { id } = req.params;
  const { attribute_name, attribute_value, price_extra = 0, sku } = req.body;

  if (!attribute_name || !attribute_value) {
    return errorResponse(res, "attribute_name and attribute_value are required.", 400);
  }

  try {
    const variantSku = sku || "SKU-" + Date.now().toString(36).toUpperCase();

    const result = await pool.query(
      `INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [id, attribute_name.trim(), attribute_value.trim(), parseFloat(price_extra) || 0, variantSku]
    );

    return successResponse(res, result.rows[0], "Product variant added successfully.", 201);
  } catch (err) {
    return errorResponse(res, "Failed to add variant: " + err.message, 500);
  }
};

export const updateVariant = async (req, res) => {
  const { id, variantId } = req.params;
  const { attribute_name, attribute_value, price_extra, sku, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE product_variants
       SET
         attribute_name = COALESCE($1, attribute_name),
         attribute_value = COALESCE($2, attribute_value),
         price_extra = COALESCE($3, price_extra),
         sku = COALESCE($4, sku),
         is_active = COALESCE($5, is_active)
       WHERE id = $6 AND product_id = $7
       RETURNING *;`,
      [
        attribute_name,
        attribute_value,
        price_extra !== undefined ? parseFloat(price_extra) : null,
        sku,
        is_active,
        variantId,
        id
      ]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Variant not found for this product.", 404);
    }

    return successResponse(res, result.rows[0], "Variant updated successfully.");
  } catch (err) {
    return errorResponse(res, "Failed to update variant: " + err.message, 500);
  }
};
