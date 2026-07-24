import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createProjectController,
  createTeamController,
  createWorkspaceController,
  fetchTeamProjectController,
  fetchWorkspaceController,
  lastActiveWorkspaceController,
  fetchStatusController,
  fetchActivityController,
  fetchWorkspaceMembers,
  getCompletedTasksCount,
} from "../controller/workspace.controller.js";

const router = Router();

router.get("/workspaces", authMiddleware, fetchWorkspaceController);
router.get("/workspaces/:workspaceId", authMiddleware, fetchWorkspaceMembers);
router.post("/workspace", authMiddleware, createWorkspaceController);
router.get("/team/:workspaceId", authMiddleware, fetchTeamProjectController);
router.post("/team", authMiddleware, createTeamController);
router.post(
  "/last-active-workspace/:workspaceId",
  authMiddleware,
  lastActiveWorkspaceController,
);
router.post("/project", authMiddleware, createProjectController);
router.get("/status/:workspaceId", authMiddleware, fetchStatusController);
router.get("/activities/:workspaceId", authMiddleware, fetchActivityController);
router.get("/completed/count", authMiddleware, getCompletedTasksCount);

export default router;
