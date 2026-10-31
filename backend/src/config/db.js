import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env relative to this file first, fallback to cwd
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD || ""),

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL error:", err);
});

export const testConnection = async () => {
    try {
        const result = await pool.query(
            "SELECT current_database(), current_user, version()"
        );

        console.log("PostgreSQL connected successfully!");
        console.log(result.rows[0]);

        return true;
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
        return false;
    }
};

export default pool;
