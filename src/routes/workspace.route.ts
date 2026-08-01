import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createProjectController,
  createTeamController,
  createWorkspaceController,
  fetchTeamProjectController,
  fetchWorkspaceController,
  // lastActiveWorkspaceController,
  fetchStatusController,
  fetchWorkspaceMembers,
} from "../controller/workspace.controller.js";

const router = Router();

router.get("/workspaces", authMiddleware, fetchWorkspaceController);
router.get("/workspaces/:workspaceId", authMiddleware, fetchWorkspaceMembers);
router.post("/workspace", authMiddleware, createWorkspaceController);
router.get("/team/:workspaceId", authMiddleware, fetchTeamProjectController);
router.post("/team", authMiddleware, createTeamController);
// router.post(
//   "/last-active-workspace/:workspaceId",
//   authMiddleware,
//   // lastActiveWorkspaceController,
// );
router.post("/project", authMiddleware, createProjectController);
router.get("/status/:workspaceId", authMiddleware, fetchStatusController);

export default router;
