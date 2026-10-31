import { Router } from "express";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  getQuotations,
  getQuotationById,
  createQuotation,
  createQuotationFromTemplate,
  sendQuotation,
  cancelQuotation,
  confirmQuotation
} from "./quotations.controller.js";

const router = Router();

// Templates
router.get("/templates", getTemplates);
router.get("/templates/:id", getTemplateById);
router.post("/templates", createTemplate);
router.post("/from-template", createQuotationFromTemplate);

// Quotations
router.get("/", getQuotations);
router.get("/:id", getQuotationById);
router.post("/", createQuotation);
router.post("/:id/send", sendQuotation);
router.post("/:id/cancel", cancelQuotation);
router.post("/:id/confirm", confirmQuotation);

export default router;
