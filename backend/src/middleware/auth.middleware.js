import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { errorResponse } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET || "brightloop_super_secure_jwt_secret_key_2026";

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Authentication required. Bearer token missing.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user record
    const result = await pool.query(
      "SELECT id, email, name, role, is_active FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return errorResponse(res, "User not found or account deactivated", 401);
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return errorResponse(res, "Invalid or expired authentication token", 401);
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, `Forbidden. Role '${req.user.role}' lacks permission.`, 403);
    }

    next();
  };
};
