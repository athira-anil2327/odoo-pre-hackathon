import { Router } from "express";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  generateBillingCycleInvoices,
  confirmInvoice,
  cancelInvoice
} from "./invoices.controller.js";

const router = Router();

router.get("/", getInvoices);
router.post("/", createInvoice);
router.post("/generate-cycle", generateBillingCycleInvoices);
router.post("/generate-billing-cycle", generateBillingCycleInvoices);
router.get("/:id", getInvoiceById);
router.post("/:id/confirm", confirmInvoice);
router.post("/:id/cancel", cancelInvoice);

export default router;
