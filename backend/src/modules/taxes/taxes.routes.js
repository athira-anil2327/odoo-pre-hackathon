import { Router } from "express";
import { getTaxes, createTax } from "./taxes.controller.js";

const router = Router();

router.get("/", getTaxes);
router.post("/", createTax);

export default router;
