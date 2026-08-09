import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  dashboardAttentionController,
  dashboardCountController,
  fetchActivityController,
  getCompletedTasksCount,
} from "../controller/dashboard.controller.js";
const router = Router();

router.get("/activities/:workspaceId", authMiddleware, fetchActivityController);
router.get("/completed/count", authMiddleware, getCompletedTasksCount);
router.get(
  "/attention/:workspaceId",
  authMiddleware,
  dashboardAttentionController,
);
router.get("/count/:workspaceId", authMiddleware, dashboardCountController);

export default router;
