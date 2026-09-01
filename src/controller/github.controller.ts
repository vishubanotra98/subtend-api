import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { getValidAccessToken } from "../utils/getValidAccessToken.js";
import { BASE_URL_API } from "../constants/constant.js";

export const fetchProjectRepoController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_PROJECT_ID",
        message: "A valid project ID is required.",
        data: null,
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        data: null,
      });
    }

    const projectRepos = await prisma.projectRepo.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        projectId: true,
        githubIntegrationId: true,
        repoFullName: true,
        repoId: true,
        webhookId: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "PROJECT_REPOSITORIES_FETCHED",
      message: "Project repositories fetched successfully.",
      data: {
        repositories: projectRepos,
      },
    });
  },
);

export const connectProjectRepoController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId, projectId } = req.params;
    const { repoId, repoFullName, ownerName, repoName } = req.body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_WORKSPACE_ID",
        message: "A valid workspace ID is required.",
        data: null,
      });
    }

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_PROJECT_ID",
        message: "A valid project ID is required.",
        data: null,
      });
    }

    if (!repoId || typeof repoId !== "number") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_REPOSITORY_ID",
        message: "A valid repository ID is required.",
        data: null,
      });
    }

    if (
      typeof repoFullName !== "string" ||
      typeof repoName !== "string" ||
      !repoFullName.trim() ||
      !repoName.trim()
    ) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_REPOSITORY_NAME",
        message: "A valid repository name is required.",
        data: null,
      });
    }

    if (!ownerName || typeof ownerName !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_OWNER",
        message: "A valid owner name is required.",
        data: null,
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        team: {
          workspaceId,
          deletedAt: null,
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "PROJECT_NOT_FOUND",
        message: "Project not found in this workspace.",
        data: null,
      });
    }

    const githubIntegration = await prisma.githubIntegration.findUnique({
      where: {
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!githubIntegration) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "GITHUB_NOT_CONNECTED",
        message: "GitHub is not connected to this workspace.",
        data: null,
      });
    }

    const existingProjectRepo = await prisma.projectRepo.findFirst({
      where: {
        projectId,
        repoId,
      },
    });

    if (existingProjectRepo) {
      return res.status(409).json({
        success: false,
        status: 409,
        code: "REPOSITORY_ALREADY_CONNECTED",
        message: "This repository is already connected to the project.",
        data: null,
      });
    }

    const existingRepo = await prisma.projectRepo.findUnique({
      where: {
        repoId,
      },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (existingRepo) {
      return res.status(409).json({
        success: false,
        status: 409,
        code: "REPOSITORY_ALREADY_ASSIGNED",
        message: "This repository is already connected to another project.",
        data: null,
      });
    }

    const accessToken = await getValidAccessToken(workspaceId);

    const hookRes = await fetch(
      `https://api.github.com/repos/${ownerName}/${repoName}/hooks`,

      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2026-03-10",
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: "web",
          active: true,
          events: ["push", "pull_request"],
          config: {
            url: `${BASE_URL_API}/api/v1/subtend/webhook`,
            content_type: "json",
            insecure_ssl: "0",
          },
        }),
      },
    );

    const hookData = await hookRes?.json();

    if (!hookRes.ok) {
      return res.status(hookRes.status).json({
        success: false,
        status: hookRes.status,
        code: "GITHUB_WEBHOOK_CREATION_FAILED",
        message: "Failed to create GitHub webhook.",
        data: null,
      });
    }

    const projectRepo = await prisma.projectRepo.create({
      data: {
        projectId,
        githubIntegrationId: githubIntegration.id,
        repoFullName,
        repoId,
        webhookId: hookData?.id,
      },
    });

    return res.status(201).json({
      success: true,
      status: 201,
      code: "PROJECT_REPOSITORY_CONNECTED",
      message: "GitHub repository connected successfully.",
      data: {
        repository: projectRepo,
      },
    });
  },
);

export const gitWebhookController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("GitHub webhook:", req.body);

    return res.status(200).json({
      success: true,
    });
  },
);

export const getGithubReposController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_WORKSPACE_ID",
        message: "A valid workspace ID is required.",
        data: null,
      });
    }

    const integration = await prisma.githubIntegration.findFirst({
      where: {
        workspaceId,
      },
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "GITHUB_NOT_CONNECTED",
        message: "GitHub is not connected to this workspace.",
        data: null,
      });
    }

    const accessToken = await getValidAccessToken(workspaceId);

    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        status: 502,
        code: "GITHUB_FETCH_FAILED",
        message: "Failed to fetch repositories from GitHub.",
        data: null,
      });
    }

    const repos = await response.json();

    const repoList = repos?.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      user_name: repo.owner.login,
      default_branch: repo.default_branch,
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      code: "GITHUB_REPOSITORIES_FETCHED",
      message: "GitHub repositories fetched successfully.",
      data: {
        repositories: repoList,
      },
    });
  },
);
