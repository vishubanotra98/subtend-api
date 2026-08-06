import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import dayjs from "dayjs";

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

/*
---- Attention
1. Blocked -> by which issue, assigned to whom
2. Due date
        - past the Due Date
        - Due Today
3. Unassigned but urgent
4. No updates from 7+ days
*/

export const dashboardAttentionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    
  },
);
