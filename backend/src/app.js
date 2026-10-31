
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";

const { default: pool, testConnection } = await import("./config/db.js");

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Auth & Core Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        message: "BrightLoop Backend Running",
        status: "OK",
    });
});

// Database test route
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT current_database(), current_user"
        );

        res.status(200).json({
            success: true,
            message: "Database connection successful",
            database: result.rows[0],
        });

    } catch (error) {
        console.error("Database query error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database query failed",
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        const connected = await testConnection();

        if (!connected) {
            console.error("Cannot start server without database connection.");
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
