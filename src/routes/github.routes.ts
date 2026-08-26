import { Router } from "express";
import { getGithubReposController } from "../controller/github.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/workspace/:workspaceId/github/repos",
  authMiddleware,
  getGithubReposController,
);

export default router;
