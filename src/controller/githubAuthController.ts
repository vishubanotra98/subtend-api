import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { redis } from "../config/redis.js";
import crypto from "node:crypto";

const GITHUB_OAUTH_PREFIX = "github-oauth";

export const githubLoginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const userId = req.userId;
    const workspaceId = query?.workspaceId as string;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_WORKSPACE_ID",
        message: "Workspace ID is required.",
      });
    }

    const membership = await prisma.workspaceMembers.findFirst({
      where: { workspaceId, userId },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        status: 403,
        code: "FORBIDDEN",
        message: "You do not have access to this workspace.",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
        message: "Workspace not found.",
      });
    }

    const state = `${GITHUB_OAUTH_PREFIX}-${crypto.randomUUID()}`;
    const stateData = JSON.stringify({ workspaceId, userId });
    await redis.set(state, stateData, "EX", 600);

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: `${process.env.BASE_URL_API}/auth/github/callback`!,
      scope: "repo",
      state,
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  },
);

export const githubCallBackController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code;
    const state = req.query.state;

    const FRONTEND_ERROR_BASE = `${process.env.BASE_URL_CLIENT}/integration`;

    if (!state || typeof state !== "string") {
      return res.redirect(
        `${FRONTEND_ERROR_BASE}?githubconnected=false&error=INVALID_OAUTH_STATE`,
      );
    }

    const stateData = await redis.get(state);

    if (!stateData) {
      return res.redirect(
        `${FRONTEND_ERROR_BASE}?githubconnected=false&error=INVALID_OAUTH_STATE`,
      );
    }

    await redis.del(state);

    const parsedState = JSON.parse(stateData);
    const workspaceId = parsedState?.workspaceId;

    if (!code) {
      return res.redirect(
        `${FRONTEND_ERROR_BASE}?githubconnected=false&workspaceId=${workspaceId}&error=GITHUB_AUTH_FAILED`,
      );
    }

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
      },
    );

    const data = await response.json();

    if (data?.error) {
      return res.redirect(
        `${FRONTEND_ERROR_BASE}?githubconnected=false&workspaceId=${workspaceId}&error=GITHUB_AUTH_FAILED`,
      );
    }

    const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(
      Date.now() + data.refresh_token_expires_in * 1000,
    );

    const existingAccount = await prisma.githubIntegration.findUnique({
      where: { workspaceId },
    });

    if (existingAccount) {
      return res.redirect(
        `${FRONTEND_ERROR_BASE}?githubconnected=false&workspaceId=${workspaceId}&error=GITHUB_ALREADY_INTEGRATED`,
      );
    }

    const gitInt = await prisma.githubIntegration.create({
      data: {
        workspaceId,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        accessTokenExpireAt: accessTokenExpiresAt,
        refreshTokenExpireAt: refreshTokenExpiresAt,
      },
    });

    if (!gitInt) {
      return res.redirect(
        `${FRONTEND_ERROR_BASE}?githubconnected=false&workspaceId=${workspaceId}&error=GITHUB_AUTH_FAILED`,
      );
    }

    return res.redirect(
      `${FRONTEND_ERROR_BASE}?githubconnected=true&workspaceId=${workspaceId}`,
    );
  },
);

export const getGithubIntegrationStatusController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_WORKSPACE_ID",
        message: "Workspace ID is required.",
      });
    }

    const integration = await prisma.githubIntegration.findUnique({
      where: { workspaceId },
      select: {
        id: true,
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      data: {
        connected: !!integration,
      },
    });
  },
);
