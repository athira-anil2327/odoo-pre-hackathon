import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "brightloop-enterprise-jwt-secret-2026";

/**
 * Strict Brightloop Password Policy Validator:
 * - More than 8 characters (length >= 9)
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 special character (!@#$%^&* etc.)
 */
export function validatePassword(password) {
  if (typeof password !== "string") return false;
  const hasLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  return hasLength && hasUpper && hasLower && hasSpecial;
}

/**
 * GET /api/auth/check-email?email=...
 * Case-insensitive email uniqueness check
 */
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email query param is required" });
    }

    const normalized = email.toLowerCase().trim();
    const result = await pool.query(
      "SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [normalized]
    );

    const isAvailable = result.rows.length === 0;
    return res.status(200).json({
      success: true,
      email: normalized,
      available: isAvailable,
      message: isAvailable
        ? "Email address is available."
        : "Each email address can belong to only one account. This email is already registered."
    });
  } catch (err) {
    console.error("Check email error:", err.message);
    return res.status(500).json({ success: false, message: "Server error checking email availability." });
  }
});

/**
 * POST /api/auth/register
 * Customer Company Registration with strict RBAC & email/password validation
 */
router.post("/register", async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, password, company, phone, billing_address } = req.body;

    // 1. Required fields
    if (!name || !email || !password || !company) {
      return res.status(400).json({
        success: false,
        message: "Contact name, company name, corporate email, and password are required."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please provide a valid corporate email address."
      });
    }

    // 3. Unique email constraint (case-insensitive)
    const existing = await client.query(
      "SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Each email address can belong to only one account. '${normalizedEmail}' is already registered.`
      });
    }

    // 4. Strict password policy check
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password does not satisfy enterprise security policy: length must be > 8 characters, and contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character."
      });
    }

    // 5. Begin transaction
    await client.query("BEGIN");

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user (role = 'customer' strictly enforced from public registration)
    const userInsertQuery = `
      INSERT INTO users (email, password_hash, name, role, is_active, is_verified)
      VALUES ($1, $2, $3, 'customer', true, true)
      RETURNING id, email, name, role, created_at;
    `;
    const userRes = await client.query(userInsertQuery, [
      normalizedEmail,
      passwordHash,
      name.trim()
    ]);
    const newUser = userRes.rows[0];

    // Insert customer record linked to user
    const customerInsertQuery = `
      INSERT INTO customers (name, email, phone, company, billing_address, user_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, customer_number, name, email, company, created_at;
    `;
    const customerRes = await client.query(customerInsertQuery, [
      name.trim(),
      normalizedEmail,
      phone ? phone.trim() : null,
      company.trim(),
      billing_address || `${company.trim()} Headquarters`,
      newUser.id
    ]);
    const newCustomer = customerRes.rows[0];

    await client.query("COMMIT");

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        customerId: newCustomer.customer_number
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: `Account created successfully. Customer Number: ${newCustomer.customer_number}`,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        company: newCustomer.company,
        customerNumber: newCustomer.customer_number
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Registration error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the account. Please try again."
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/forgot-password
 * Generates an expiring password reset token for the registered email
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Registered email address is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRes = await pool.query(
      "SELECT id, name, email FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No account is registered under '${normalizedEmail}'.`
      });
    }

    const user = userRes.rows[0];

    // Generate secure crypto token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await pool.query(
      `UPDATE users
       SET reset_token_hash = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [tokenHash, expiry, user.id]
    );

    const clientOrigin = req.headers.origin || "http://localhost:5173";
    const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    return res.status(200).json({
      success: true,
      message: `Password reset link dispatched to ${normalizedEmail}.`,
      token: rawToken,
      resetUrl,
      expiry
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to process forgot password request." });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies token and updates user password with strict validation
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required."
      });
    }

    // 1. Password policy verification
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet enterprise security policy (length > 8, uppercase, lowercase, special character required)."
      });
    }

    // 2. Hash token to match database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const userRes = await pool.query(
      `SELECT id, email, name FROM users
       WHERE reset_token_hash = $1 AND reset_token_expiry > CURRENT_TIMESTAMP
       LIMIT 1`,
      [tokenHash]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link."
      });
    }

    const user = userRes.rows[0];

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, reset_token_hash = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new credentials."
    });
  } catch (err) {
    console.error("Reset password error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
});

export default router;
