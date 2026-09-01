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

export const gitWebhookController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    if (!event || typeof event !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_GITHUB_EVENT",
        message: "GitHub event header is missing.",
        data: null,
      });
    }

    const repoId = Number(payload?.repository?.id);

    if (!Number.isInteger(repoId)) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_REPOSITORY_ID",
        message: "A valid GitHub repository ID is required.",
        data: null,
      });
    }

    const projectRepo = await prisma.projectRepo.findUnique({
      where: {
        repoId,
      },
      select: {
        projectId: true,
      },
    });

    if (!projectRepo) {
      return res.status(200).json({
        success: true,
        status: 200,
        code: "REPOSITORY_NOT_CONNECTED",
        message: "Repository is not connected to Subtend.",
        data: null,
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectRepo.projectId,
      },
      select: {
        id: true,
        team: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!project?.team?.workspaceId) {
      return res.status(200).json({
        success: true,
        status: 200,
        code: "PROJECT_NOT_FOUND",
        message: "Project associated with repository was not found.",
        data: null,
      });
    }

    const workspaceId = project.team.workspaceId;

    if (event === "push") {
      if (payload.ref !== "refs/heads/main") {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "PUSH_IGNORED",
          message: "Push was not made to the main branch.",
          data: null,
        });
      }

      const commits = payload.commits;

      if (!Array.isArray(commits) || commits.length === 0) {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "NO_COMMITS",
          message: "No commits found in push.",
          data: null,
        });
      }

      for (const commit of commits) {
        if (!commit?.id || typeof commit.message !== "string") {
          continue;
        }

        const ticketMatch = commit.message.match(/\b[A-Z][A-Z0-9]*-(\d+)\b/);

        if (!ticketMatch) {
          continue;
        }

        const ticketNumber = Number(ticketMatch[1]);

        if (!Number.isInteger(ticketNumber)) {
          continue;
        }

        const issue = await prisma.issue.findFirst({
          where: {
            ticket_num: ticketNumber,
            project: {
              team: {
                workspaceId,
              },
            },
            deletedAt: null,
          },
          select: {
            id: true,
          },
        });

        if (!issue) {
          continue;
        }

        const existingHistory = await prisma.gitHistory.findFirst({
          where: {
            repoId,
            issueId: issue.id,
            type: "PUSH",
            pushHead: commit.id,
          },
          select: {
            id: true,
          },
        });

        if (existingHistory) {
          continue;
        }

        await prisma.gitHistory.create({
          data: {
            projectId: project.id,
            issueId: issue.id,
            ticketNumber,
            repoId,

            type: "PUSH",

            head: payload.after ?? null,
            base: payload.before ?? null,

            pushHead: commit.id,

            pushedAt: commit.timestamp
              ? new Date(commit.timestamp)
              : new Date(),

            commits: commit,
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        code: "PUSH_PROCESSED",
        message: "GitHub push processed successfully.",
        data: null,
      });
    }

    if (event === "pull_request") {
      const pullRequest = payload.pull_request;

      if (!pullRequest) {
        return res.status(400).json({
          success: false,
          status: 400,
          code: "INVALID_PULL_REQUEST",
          message: "Pull request data is missing.",
          data: null,
        });
      }

      if (
        payload.action !== "closed" ||
        pullRequest.merged !== true ||
        pullRequest.base?.ref !== "main"
      ) {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "PULL_REQUEST_IGNORED",
          message: "Pull request is not a merged PR into main.",
          data: null,
        });
      }

      const ticketMatch = pullRequest.title?.match(/\b[A-Z][A-Z0-9]*-(\d+)\b/);

      if (!ticketMatch) {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "TICKET_REFERENCE_NOT_FOUND",
          message: "No Subtend ticket reference found in pull request.",
          data: null,
        });
      }

      const ticketNumber = Number(ticketMatch[1]);

      if (!Number.isInteger(ticketNumber)) {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "INVALID_TICKET_REFERENCE",
          message: "Invalid Subtend ticket reference.",
          data: null,
        });
      }

      const issue = await prisma.issue.findFirst({
        where: {
          ticket_num: ticketNumber,
          project: {
            team: {
              workspaceId,
            },
          },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!issue) {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "ISSUE_NOT_FOUND",
          message: "Referenced Subtend issue was not found.",
          data: null,
        });
      }

      const existingHistory = await prisma.gitHistory.findFirst({
        where: {
          repoId,
          pullReqId: pullRequest.id,
          type: "PULL_REQUEST",
        },
        select: {
          id: true,
        },
      });

      if (existingHistory) {
        return res.status(200).json({
          success: true,
          status: 200,
          code: "PULL_REQUEST_ALREADY_RECORDED",
          message: "Pull request history already exists.",
          data: null,
        });
      }

      await prisma.gitHistory.create({
        data: {
          projectId: project.id,
          issueId: issue.id,
          ticketNumber,
          repoId,

          type: "PULL_REQUEST",

          pullReqId: pullRequest.id,

          title: pullRequest.title ?? null,

          closedAt: pullRequest.closed_at
            ? new Date(pullRequest.closed_at)
            : null,

          head: pullRequest.head?.ref ?? null,

          base: pullRequest.base?.ref ?? null,
        },
      });

      return res.status(200).json({
        success: true,
        status: 200,
        code: "PULL_REQUEST_PROCESSED",
        message: "Merged pull request processed successfully.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      code: "GITHUB_EVENT_IGNORED",
      message: `GitHub event "${event}" is not handled.`,
      data: null,
    });
  },
);

export const issueGithubHistoryController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { issueId } = req.params;

    if (!issueId || typeof issueId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_ISSUE_ID",
        message: "A valid issue ID is required.",
        data: null,
      });
    }

    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
      },
      select: {
        id: true,
      },
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
        data: null,
      });
    }

    const gitHistories = await prisma.gitHistory.findMany({
      where: {
        issueId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "GITHUB_HISTORY_FETCHED",
      message: "GitHub history fetched successfully.",
      data: {
        histories: gitHistories,
      },
    });
  },
);
