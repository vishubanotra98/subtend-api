import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import dayjs from "dayjs";
import { attentionCalculation } from "../helpers/attention.helper.js";

export const dashboardAttentionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;

    if (typeof workspaceId !== "string" || !workspaceId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_WORKSPACE_ID",
        message: "Invalid Workspace id.",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        statuses: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
        message: "Workspace with this does not exist.",
      });
    }

    const statusList = workspace?.statuses;

    const issues = await prisma.issue.findMany({
      where: {
        project: { team: { workspace: { id: workspaceId } } },
      },
      select: {
        id: true,
        title: true,
        statusId: true,
        priority: true,
        targetDate: true,
        updatedAt: true,
        blockedAt: true,
        assigneeId: true,

        project: {
          select: {
            id: true,
            name: true,

            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const attentionIssues = attentionCalculation({
      issues,
      statusList,
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ATTENTION_FETCHED",
      message: "Attention Issues fetched successfully.",
      data: { attentionIssues },
    });
  },
);

export const getCompletedTasksCount = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { statusId, workspaceId } = req.query;

    if (typeof statusId !== "string" || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "statusId and workspaceId are required",
      });
    }

    const startDate = dayjs().subtract(6, "day").startOf("day").toDate();

    const completedTasks = await prisma.issue.findMany({
      where: {
        project: { team: { workspaceId } },
        statusId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = dayjs().subtract(6 - i, "day");
      return {
        day: date.format("ddd"),
        date: date.format("YYYY-MM-DD"),
        count: 0,
      };
    });

    completedTasks.forEach((activity) => {
      const activityDate = dayjs(activity.createdAt).format("YYYY-MM-DD");
      const dayIndex = last7Days.findIndex((d) => d.date === activityDate);
      if (dayIndex !== -1) {
        last7Days[dayIndex].count += 1;
      }
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "COMPLETED_TASKS_FETCHED",
      message: "Completed tasks count fetched successfully.",
      data: { completedTasks: last7Days },
    });
  },
);

export const fetchActivityController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params.workspaceId as string;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "workspaceId is required",
      });
    }

    const activities = await prisma.activity.findMany({
      where: { workspaceId },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ACTIVITIES_FETCHED",
      message: "Activities fetched successfully.",
      data: { activities },
    });
  },
);
