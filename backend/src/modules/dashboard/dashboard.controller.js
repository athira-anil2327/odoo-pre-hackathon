import pool from "../../config/db.js";
import { successResponse, errorResponse } from "../../utils/response.js";

export const getFinanceSummary = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM view_finance_summary;");
    return successResponse(res, result.rows[0] || {}, "Finance summary retrieved.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve finance summary: " + err.message, 500);
  }
};

export const getOverdueInvoicesReport = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM view_overdue_invoices ORDER BY days_overdue DESC;");
    return successResponse(res, result.rows, "Overdue invoices report retrieved.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve overdue invoices: " + err.message, 500);
  }
};

export const getSubscriptionsSummaryReport = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM view_subscription_summary ORDER BY total_amount DESC;");
    return successResponse(res, result.rows, "Subscription summary report retrieved.");
  } catch (err) {
    return errorResponse(res, "Failed to retrieve subscription summary: " + err.message, 500);
  }
};
