import { Router } from "express";
import {
  connectProjectRepoController,
  fetchProjectRepoController,
  getGithubReposController,
  gitWebhookController,
  issueGithubHistoryController,
} from "../controller/github.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/repositories/:projectId",
  authMiddleware,
  fetchProjectRepoController,
);
router.post(
  "/workspace/:workspaceId/project/:projectId/repositories",
  authMiddleware,
  connectProjectRepoController,
);
router.get(
  "/workspace/:workspaceId/github/repos",
  authMiddleware,
  getGithubReposController,
);
router.post("/subtend/webhook", gitWebhookController);
router.get(
  "/issue/:issueId/github/history",
  authMiddleware,
  issueGithubHistoryController,
);

export default router;
