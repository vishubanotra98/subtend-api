import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { getValidAccessToken } from "../utils/getValidAccessToken.js";

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
