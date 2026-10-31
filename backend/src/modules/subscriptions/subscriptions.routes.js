import { Router } from "express";
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  closeSubscription,
  renewSubscription,
  getSubscriptionEvents
} from "./subscriptions.controller.js";

const router = Router();

router.get("/", getSubscriptions);
router.get("/:id", getSubscriptionById);
router.post("/", createSubscription);
router.post("/:id/pause", pauseSubscription);
router.post("/:id/resume", resumeSubscription);
router.post("/:id/close", closeSubscription);
router.post("/:id/renew", renewSubscription);
router.get("/:id/events", getSubscriptionEvents);

export default router;
