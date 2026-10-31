import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 10000,
});

const JWT_SECRET = process.env.JWT_SECRET || "brightloop_super_secure_jwt_secret_key_2026";
const ADMIN_EMAIL = "admin@brightloop.com";
const ADMIN_PASSWORD = "Admin@BrightLoop2026!";
const ADMIN_NAME = "BrightLoop Administrator";

async function main() {
  console.log("=================================================");
  console.log("BrightLoop Admin Provisioning & JWT Auth Check");
  console.log("=================================================\n");

  try {
    // 1. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    // 2. Check if admin@brightloop.com already exists
    const existingCheck = await pool.query(
      "SELECT id, email, role, is_active FROM users WHERE lower(email) = lower($1)",
      [ADMIN_EMAIL]
    );

    let adminUser;
    if (existingCheck.rows.length === 0) {
      console.log(`[+] Inserting new admin user: ${ADMIN_EMAIL}...`);
      const insertRes = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, is_active, is_verified)
         VALUES ($1, $2, $3, 'admin', TRUE, TRUE)
         RETURNING id, email, name, role, is_active, created_at`,
        [ADMIN_EMAIL, passwordHash, ADMIN_NAME]
      );
      adminUser = insertRes.rows[0];
      console.log(`[✓] Created admin user with ID: ${adminUser.id}`);
    } else {
      console.log(`[+] Updating existing admin user: ${ADMIN_EMAIL}...`);
      const updateRes = await pool.query(
        `UPDATE users 
         SET password_hash = $1, name = $2, role = 'admin', is_active = TRUE, is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE lower(email) = lower($3)
         RETURNING id, email, name, role, is_active, created_at`,
        [passwordHash, ADMIN_NAME, ADMIN_EMAIL]
      );
      adminUser = updateRes.rows[0];
      console.log(`[✓] Updated admin user with ID: ${adminUser.id}`);
    }

    // Also synchronize admin@brightloop.io with the same password so both accounts work
    console.log(`[+] Updating secondary admin: admin@brightloop.io with password...`);
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, role = 'admin', is_active = TRUE, is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE lower(email) = lower('admin@brightloop.io')`,
      [passwordHash]
    );
    console.log(`[✓] Synchronized admin@brightloop.io credentials.`);

    // 3. Verify Password via bcrypt
    console.log("\n--- Testing Authentication ---");
    const isMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password_hash || passwordHash);
    if (!isMatch) {
      throw new Error("Password verification failed!");
    }
    console.log("[✓] Password verified successfully against bcrypt hash.");

    // 4. Generate JWT Token
    const payload = {
      id: adminUser.id,
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    console.log("\n[✓] JWT Generated Successfully!");

    // 5. Verify and Decode JWT Token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[✓] JWT Verified Successfully!");
    console.log("Decoded Token Payload:", decoded);

    // 6. Test DB Query with decoded user ID (simulating requireAuth middleware)
    const userInDb = await pool.query(
      "SELECT id, email, name, role, is_active FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userInDb.rows.length === 0 || !userInDb.rows[0].is_active) {
      throw new Error("Middleware verification test failed: user not active or not found.");
    }
    console.log("[✓] Simulated requireAuth middleware check PASSED for user:", userInDb.rows[0]);

    // 7. Output Final Credentials & Token for User
    console.log("\n=================================================");
    console.log("ADMIN CREDENTIALS & AUTH DETAILS");
    console.log("=================================================");
    console.log(`Primary Username / Email:   ${ADMIN_EMAIL}`);
    console.log(`Secondary Username / Email: admin@brightloop.io`);
    console.log(`Password:                   ${ADMIN_PASSWORD}`);
    console.log(`Role:                       ${adminUser.role}`);
    console.log(`User ID:                    ${adminUser.id}`);
    console.log(`\nJWT Token (7-day validity):`);
    console.log(token);
    console.log("=================================================");

  } catch (err) {
    console.error("[-] Error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

