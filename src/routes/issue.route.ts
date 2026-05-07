import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  createIssueController,
  deleteIssueController,
  editIssueController,
  fetchIssueByProjectController,
  fetchIssuesController,
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

export default router;
