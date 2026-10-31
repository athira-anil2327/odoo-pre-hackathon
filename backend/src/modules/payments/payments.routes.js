import { Router } from "express";
import { getPayments, recordPayment } from "./payments.controller.js";

const router = Router();

router.get("/", getPayments);
router.post("/", recordPayment);

export default router;
