import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createIssueController,
  deleteIssueController,
  editIssueController,
  fetchIssueByProjectController,
  fetchIssuesController,
  getMyIssuesController,
  moveCardController,
} from "../controller/issue.controller.js";

const router = Router();

router.get("/issue/:workspaceId", authMiddleware, fetchIssuesController);
router.post("/issue", authMiddleware, createIssueController);
router.patch("/issue", authMiddleware, editIssueController);
router.delete("/issue", authMiddleware, deleteIssueController);
router.get(
  "/issue/project/:projectId",
  authMiddleware,
  fetchIssueByProjectController,
);
router.put("/issue-move", authMiddleware, moveCardController);
router.get(
  "/workspace/:workspaceId/my-issues",
  authMiddleware,
  getMyIssuesController,
);

export default router;
