import { Router } from "express";
import {
  connectProjectRepoController,
  fetchProjectRepoController,
  getGithubReposController,
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

export default router;
