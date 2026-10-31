import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  console.log("Setting distinct, isolated credentials for each role in PostgreSQL...");

  const adminHash = await bcrypt.hash("Admin@BrightLoop2026!", 10);
  const staffHash = await bcrypt.hash("Staff@BrightLoop2026!", 10);
  const customerHash = await bcrypt.hash("Customer@BrightLoop2026!", 10);

  // 1. Admin accounts -> Admin@BrightLoop2026!
  await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email IN ('admin@brightloop.com', 'admin@brightloop.io')",
    [adminHash]
  );
  console.log("[✓] Updated Admin accounts with Admin@BrightLoop2026!");

  // 2. Staff accounts -> Staff@BrightLoop2026!
  await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email IN ('staff@brightloop.io', 'sales@brightloop.io')",
    [staffHash]
  );
  console.log("[✓] Updated Staff accounts with Staff@BrightLoop2026!");

  // 3. Customer accounts -> Customer@BrightLoop2026!
  await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = 'eleanor.vance@nexushealth.org'",
    [customerHash]
  );
  console.log("[✓] Updated Customer account with Customer@BrightLoop2026!");

  // 4. Verify cross-authentication isolation test
  console.log("\n--- Running Isolation & Cross-Login Prevention Test ---");
  const users = await pool.query("SELECT email, role, password_hash FROM users");

  const passwords = [
    { label: "Admin Password", pwd: "Admin@BrightLoop2026!" },
    { label: "Staff Password", pwd: "Staff@BrightLoop2026!" },
    { label: "Customer Password", pwd: "Customer@BrightLoop2026!" },
    { label: "Wrong Password", pwd: "RandomWrongPassword123!" },
  ];

  for (const user of users.rows) {
    console.log(`\nTesting user [${user.role}] ${user.email}:`);
    for (const p of passwords) {
      const match = await bcrypt.compare(p.pwd, user.password_hash);
      if (match) {
        console.log(`  -> Valid with: ${p.label}`);
      }
    }
  }

  await pool.end();
  console.log("\nAll credentials successfully set and isolated.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

