import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { activityLogger } from "../utils/activityHandler.js";

export const fetchIssuesController = asyncHandler(
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

    const issues = await prisma.issue.findMany({
      where: { project: { team: { workspaceId } } },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ISSUES_FETCHED",
      message: "Issues fetched successfully.",
      data: { issues },
    });
  },
);

export const createIssueController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.userId;
    const {
      title,
      description,
      userId,
      priority,
      status,
      projectId,
      workspaceId,
      teamId,
    } = req.body;

    if (!title || !status || !projectId || !workspaceId || !teamId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "All fields are required",
      });
    }

    const createIssue = await prisma.issue.create({
      data: {
        title,
        description,
        priority,
        statusId: status,
        assigneeId: !userId ? currentUser : userId,
        projectId,
      },
    });

    const loggerData = {
      action: "CREATED",
      entityTitle: title,
      userId: currentUser,
      workspaceId,
      teamId,
      projectId,
      issueId: createIssue?.id,
      beforeState: null,
      afterState: null,
    };

    activityLogger(loggerData).catch((err) =>
      console.error("Activity log failed:", err),
    );

    return res.status(201).json({
      success: true,
      status: 201,
      code: "ISSUE_CREATED",
      message: "Issue created successfully.",
      data: { issue: createIssue },
    });
  },
);

export const editIssueController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      workspaceId,
      teamId,
      projectId,
      issueId,
      title,
      description,
      assigneeId,
      priority,
      statusId,
    } = req.body;
    const currentUser = req.userId;

    if (!issueId || !workspaceId || !teamId || !projectId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "issueId, workspaceId, teamId and projectId are required",
      });
    }

    const oldIssue = await prisma.issue.findFirst({
      where: { id: issueId },
    });

    if (!oldIssue) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      });
    }

    const editIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        title,
        description,
        priority,
        statusId,
        assigneeId,
        projectId,
      },
    });

    const baseData = {
      userId: currentUser,
      workspaceId,
      teamId,
      projectId,
      issueId,
    };

    const activityList = [];

    if (
      oldIssue?.title !== editIssue?.title ||
      oldIssue?.description !== editIssue?.description
    ) {
      const activity = await activityLogger({
        ...baseData,
        action: "DETAILS_UPDATED",
        entityTitle: title,
      });
      activityList.push(activity);
    }

    if (oldIssue?.priority !== editIssue?.priority) {
      const activity = await activityLogger({
        ...baseData,
        action: "PRIORITY_CHANGED",
        entityTitle: editIssue?.title,
        beforeState: { prev_priority: oldIssue?.priority },
        afterState: { new_priority: priority },
      });
      activityList.push(activity);
    }

    if (oldIssue?.assigneeId !== editIssue?.assigneeId) {
      const activity = await activityLogger({
        ...baseData,
        action: "ASSIGNED",
        entityTitle: editIssue?.title,
        beforeState: { prev_assignee: oldIssue?.assigneeId },
        afterState: { new_assignee: editIssue?.assigneeId },
      });
      activityList.push(activity);
    }

    if (oldIssue?.statusId !== editIssue?.statusId) {
      const activity = await activityLogger({
        ...baseData,
        action: "STATUS_CHANGED",
        entityTitle: editIssue?.title,
        beforeState: { previousStatusId: oldIssue?.statusId },
        afterState: { newStatusId: editIssue?.statusId },
      });
      activityList.push(activity);
    }

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ISSUE_UPDATED",
      message: "Issue updated successfully.",
      data: { issue: editIssue, activities: activityList },
    });
  },
);

export const deleteIssueController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId, issueId, projectId, teamId } = req.body;
    const currentUser = req.userId;

    if (!issueId || !workspaceId || !teamId || !projectId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "issueId, workspaceId, teamId and projectId are required",
      });
    }

    const issue = await prisma.issue.findFirst({
      where: { id: issueId },
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      });
    }

    await prisma.issue.delete({
      where: { id: issueId },
    });

    activityLogger({
      action: "DELETED",
      entityTitle: issue?.title,
      userId: currentUser,
      workspaceId,
      teamId,
      projectId,
      issueId,
      beforeState: null,
      afterState: null,
    }).catch((err) => console.error("Activity log failed:", err));

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ISSUE_DELETED",
      message: "Issue deleted successfully.",
    });
  },
);

export const fetchIssueByProjectController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "Project id is required",
      });
    }

    const issueList = await prisma.issue.findMany({
      where: { projectId },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "PROJECT_ISSUES_FETCHED",
      message: "Issue fetched successfully.",
      data: { issues: issueList },
    });
  },
);

export const moveCardController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      sourceId: issueId,
      targetId: statusId,
      workspaceId,
      teamId,
    } = req.body;

    const currentUser = req.userId;

    const fetchCard = await prisma.issue.findFirst({
      where: { id: issueId },
    });

    const previousStatus = fetchCard?.statusId;

    const card = await prisma.issue.update({
      where: { id: issueId },
      data: {
        statusId: statusId,
      },
    });

    const projectId = card.projectId;

    const loggerData = {
      action: "STATUS_CHANGED",
      entityTitle: card.title,
      userId: currentUser,
      workspaceId: workspaceId,
      teamId: teamId,
      projectId: projectId,
      issueId: card?.id,
      beforeState: {
        previousStatusId: previousStatus,
      },
      afterState: {
        newStatusId: card.statusId,
      },
    };

    const activity = await activityLogger(loggerData);
  },
);
