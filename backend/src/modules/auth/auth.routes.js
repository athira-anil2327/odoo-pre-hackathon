import { Router } from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  getUsers,
  createStaffUser
} from "./auth.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// User administration
router.get("/users", requireAuth, requireRole("admin"), getUsers);
router.post("/create-staff", requireAuth, requireRole("admin"), createStaffUser);
router.post("/staff", requireAuth, requireRole("admin"), createStaffUser);

export default router;
