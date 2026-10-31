import { Router } from "express";
import { getDiscounts, createDiscount, validateDiscount } from "./discounts.controller.js";

const router = Router();

router.get("/", getDiscounts);
router.post("/", createDiscount);
router.post("/validate", validateDiscount);

export default router;
