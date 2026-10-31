import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pool, { testConnection } from "./config/db.js";

// Auth & Core Routes from Dona/Ashil
import authRoutes from "./routes/auth.routes.js";

// Module Routers
import authRouter from "./modules/auth/auth.routes.js";
import customersRouter from "./modules/customers/customers.routes.js";
import productsRouter from "./modules/products/products.routes.js";
import plansRouter from "./modules/plans/plans.routes.js";
import quotationsRouter from "./modules/quotations/quotations.routes.js";
import subscriptionsRouter from "./modules/subscriptions/subscriptions.routes.js";
import invoicesRouter from "./modules/invoices/invoices.routes.js";
import taxesRouter from "./modules/taxes/taxes.routes.js";
import discountsRouter from "./modules/discounts/discounts.routes.js";
import paymentsRouter from "./modules/payments/payments.routes.js";
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Auth & Core Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "BrightLoop Subscription Management Backend Running",
    status: "OK",
    version: "1.0.0"
  });
});

// Database connectivity check
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database(), current_user, version()");
    res.status(200).json({
      success: true,
      message: "Database connection successful",
      database: result.rows[0]
    });
  } catch (error) {
    console.error("Database query error:", error.message);
    res.status(500).json({
      success: false,
      message: "Database query failed: " + error.message
    });
  }
});

// Mount Module APIs
app.use("/api/auth", authRouter);
app.use("/api/customers", customersRouter);
app.use("/api/products", productsRouter);
app.use("/api/plans", plansRouter);
app.use("/api/quotations", quotationsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/taxes", taxesRouter);
app.use("/api/discounts", discountsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/dashboard", dashboardRouter);

// Centralized 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `API route not found: ${req.method} ${req.originalUrl}`
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || "Internal server error"
    }
  });
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
      console.log(`BrightLoop backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
