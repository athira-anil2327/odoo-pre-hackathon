import { Router } from "express";
import {
  getFinanceSummary,
  getOverdueInvoicesReport,
  getSubscriptionsSummaryReport
} from "./dashboard.controller.js";

const router = Router();

router.get("/summary", getFinanceSummary);
router.get("/finance-summary", getFinanceSummary);
router.get("/overdue", getOverdueInvoicesReport);
router.get("/overdue-invoices", getOverdueInvoicesReport);
router.get("/subscriptions", getSubscriptionsSummaryReport);
router.get("/subscriptions-summary", getSubscriptionsSummaryReport);

export default router;
