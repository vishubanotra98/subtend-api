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
  fetchProjectByIdController,
  deleteTeamController,
  fetchProjectsController,
  deleteProjectController,
  restoreProjectController,
  restoreTeamController,
  permanentlyDeleteProjectController,
  permanentlyDeleteTeamController,
  fetchSoftDeletedProjectsController,
  fetchSoftDeletedTeamsController,
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
router.get("/projects/:workspaceId", authMiddleware, fetchProjectsController);
router.get("/project/:projectId", authMiddleware, fetchProjectByIdController);
router.get("/status/:workspaceId", authMiddleware, fetchStatusController);

// Soft Deletion
router.patch("/team/:teamId/delete", authMiddleware, deleteTeamController);
router.patch(
  "/project/:projectId/delete",
  authMiddleware,
  deleteProjectController,
);

// Fetch Deleted Projects
router.get(
  "/project/:projectId/delete",
  authMiddleware,
  fetchSoftDeletedProjectsController,
);
router.get(
  "/team/:teamId/delete",
  authMiddleware,
  fetchSoftDeletedTeamsController,
);

// Restore
router.patch(
  "/project/:projectId/restore",
  authMiddleware,
  restoreProjectController,
);
router.patch("/team/:teamId/restore", authMiddleware, restoreTeamController);

// Permanent Deletion
router.delete(
  "/project/:projectId",
  authMiddleware,
  permanentlyDeleteProjectController,
);
router.delete("/team/:teamId", authMiddleware, permanentlyDeleteTeamController);

export default router;
