import dotenv from "dotenv";
dotenv.config();

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
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