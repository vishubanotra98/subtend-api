import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { activityLogger } from "../utils/activityHandler.js";
import { ActivityAction } from "../constants/constant.js";

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
  async (req: Request, res: Response) => {
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
      targetDate,
      blockedReason,
      blockedAt,
    } = req.body;

    const requiredFields = [
      { value: title, name: "Title" },
      { value: workspaceId, name: "Workspace" },
      { value: teamId, name: "Team" },
    ];

    const missingField = requiredFields.find((field) => !field.value);

    if (!title || !workspaceId || !teamId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: `${missingField?.name} is required`,
      });
    }

    const assigneeId = userId ?? currentUser;

    const [actor, assignee, team, project, statusData] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUser },
      }),

      prisma.user.findUnique({
        where: { id: assigneeId },
      }),

      prisma.team.findUnique({
        where: { id: teamId },
      }),

      prisma.project.findUnique({
        where: { id: projectId },
      }),

      prisma.status.findUnique({
        where: { id: status },
      }),
    ]);

    if (!project || !team || !statusData || !actor) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "One or more referenced resources could not be found.",
      });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        priority,
        statusId: status,
        assigneeId,
        projectId,
        blockedReason,
        targetDate,
        blockedAt,
      },
    });

    const loggerData = {
      action: ActivityAction.CREATED,
      workspaceId,
      actor: {
        id: actor.id,
        name:
          actor.name ??
          `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim(),
        image: actor.image,
      },
      team: {
        id: team.id,
        name: team.name,
      },
      project: {
        id: project.id,
        name: project.name,
      },
      issue: {
        id: issue.id,
        title: issue.title,
        targetDate: issue.targetDate,
        blockedReason: issue.blockedReason,
        blockedAt: issue.blockedAt,
        deletedAt: issue?.deletedAt,
      },
      beforeState: null,
      afterState: {
        status: {
          id: statusData.id,
          name: statusData.name,
          color: statusData.color,
        },
        assignee: {
          id: assignee?.id,
          name:
            assignee?.name ??
            `${assignee?.firstName ?? ""} ${assignee?.lastName ?? ""}`.trim(),
          image: assignee?.image,
        },
        priority,
      },
    };

    activityLogger(loggerData).catch((err) =>
      console.error("Activity log failed:", err),
    );

    return res.status(201).json({
      success: true,
      status: 201,
      code: "ISSUE_CREATED",
      message: "Issue created successfully.",
      data: {
        issue,
      },
    });
  },
);

export const editIssueController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUser = req.userId;

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
      targetDate,
      blockedReason,
    } = req.body;

    if (!issueId || !workspaceId || !teamId || !projectId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "issueId, workspaceId, teamId and projectId are required.",
      });
    }

    const oldIssue = await prisma.issue.findUnique({
      where: {
        id: issueId,
        deletedAt: null,
      },
    });

    if (!oldIssue) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: {
        id: issueId,
      },

      data: {
        title,
        description,
        priority,
        statusId,
        assigneeId,
        projectId,
        targetDate,
        blockedReason,
      },
    });

    const [
      actor,
      team,
      project,
      previousStatus,
      currentStatus,
      previousAssignee,
      currentAssignee,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: currentUser,
        },
      }),

      prisma.team.findUnique({
        where: {
          id: teamId,
        },
      }),

      prisma.project.findUnique({
        where: {
          id: projectId,
        },
      }),

      oldIssue.statusId
        ? prisma.status.findUnique({
            where: {
              id: oldIssue.statusId,
            },
          })
        : Promise.resolve(null),

      statusId
        ? prisma.status.findUnique({
            where: {
              id: statusId,
            },
          })
        : Promise.resolve(null),

      oldIssue.assigneeId
        ? prisma.user.findUnique({
            where: {
              id: oldIssue.assigneeId,
            },
          })
        : Promise.resolve(null),

      assigneeId
        ? prisma.user.findUnique({
            where: {
              id: assigneeId,
            },
          })
        : Promise.resolve(null),
    ]);

    const actorData = {
      id: actor?.id,
      name:
        actor?.name ??
        `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim(),
      image: actor?.image,
    };

    const baseActivity = {
      workspaceId,

      actor: actorData,

      team: {
        id: team?.id,
        name: team?.name,
      },

      project: {
        id: project?.id,
        name: project?.name,
      },

      issue: {
        id: updatedIssue.id,
        title: updatedIssue.title,
      },
    };

    const activities = [];

    if (
      oldIssue.title !== updatedIssue.title ||
      oldIssue.description !== updatedIssue.description ||
      oldIssue.blockedReason !== updatedIssue.blockedReason
    ) {
      activities.push(
        activityLogger({
          ...baseActivity,

          action: ActivityAction.DETAILS_UPDATED,

          beforeState: {
            title: oldIssue.title,
            description: oldIssue.description,
            blockedReason: oldIssue.blockedReason,
          },

          afterState: {
            title: updatedIssue.title,
            description: updatedIssue.description,
            blockedReason: updatedIssue.blockedReason,
          },
        }),
      );
    }

    if (oldIssue.priority !== updatedIssue.priority) {
      activities.push(
        activityLogger({
          ...baseActivity,

          action: ActivityAction.PRIORITY_CHANGED,

          beforeState: {
            priority: oldIssue.priority,
          },

          afterState: {
            priority: updatedIssue.priority,
          },
        }),
      );
    }

    if (oldIssue.assigneeId !== updatedIssue.assigneeId) {
      activities.push(
        activityLogger({
          ...baseActivity,

          action: updatedIssue.assigneeId
            ? ActivityAction.ASSIGNED
            : ActivityAction.UNASSIGNED,

          beforeState: {
            assignee: previousAssignee
              ? {
                  id: previousAssignee.id,
                  name:
                    previousAssignee.name ??
                    `${previousAssignee.firstName ?? ""} ${
                      previousAssignee.lastName ?? ""
                    }`.trim(),
                  image: previousAssignee.image,
                }
              : null,
          },

          afterState: {
            assignee: currentAssignee
              ? {
                  id: currentAssignee.id,
                  name:
                    currentAssignee.name ??
                    `${currentAssignee.firstName ?? ""} ${
                      currentAssignee.lastName ?? ""
                    }`.trim(),
                  image: currentAssignee.image,
                }
              : null,
          },
        }),
      );
    }

    if (oldIssue.statusId !== updatedIssue.statusId) {
      activities.push(
        activityLogger({
          ...baseActivity,

          action: ActivityAction.STATUS_CHANGED,

          beforeState: {
            status: previousStatus
              ? {
                  id: previousStatus.id,
                  name: previousStatus.name,
                  color: previousStatus.color,
                }
              : null,
          },

          afterState: {
            status: currentStatus
              ? {
                  id: currentStatus.id,
                  name: currentStatus.name,
                  color: currentStatus.color,
                }
              : null,
          },
        }),
      );
    }

    const oldTargetDate = oldIssue.targetDate
      ? new Date(oldIssue.targetDate).getTime()
      : null;

    const newTargetDate = updatedIssue.targetDate
      ? new Date(updatedIssue.targetDate).getTime()
      : null;

    if (oldTargetDate !== newTargetDate) {
      activities.push(
        activityLogger({
          ...baseActivity,

          action: ActivityAction.TARGET_DATE_CHANGED,

          beforeState: {
            targetDate: oldIssue.targetDate,
          },

          afterState: {
            targetDate: updatedIssue.targetDate,
          },
        }),
      );
    }

    const activityLogs = await Promise.all(activities);

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ISSUE_UPDATED",
      message: "Issue updated successfully.",
      data: {
        issue: updatedIssue,
        activities: activityLogs,
      },
    });
  },
);

export const deleteIssueController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workspaceId, issueId, projectId, teamId } = req.query;
    const currentUser = req.userId;

    if (
      typeof issueId !== "string" ||
      typeof workspaceId !== "string" ||
      typeof projectId !== "string" ||
      typeof teamId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "issueId, workspaceId, teamId and projectId are required.",
      });
    }

    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
        deletedAt: null,
      },
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      });
    }

    const [actor, team, project, status, assignee] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: currentUser,
        },
      }),

      prisma.team.findUnique({
        where: {
          id: teamId,
        },
      }),

      prisma.project.findUnique({
        where: {
          id: projectId,
        },
      }),

      issue.statusId
        ? prisma.status.findUnique({
            where: {
              id: issue.statusId,
            },
          })
        : Promise.resolve(null),

      issue.assigneeId
        ? prisma.user.findUnique({
            where: {
              id: issue.assigneeId,
            },
          })
        : Promise.resolve(null),
    ]);

    await prisma.issue.delete({
      where: {
        id: issueId,
      },
    });

    const loggerData = {
      action: ActivityAction.DELETED,
      workspaceId,
      actor: {
        id: actor?.id,
        name:
          actor?.name ??
          `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim(),
        image: actor?.image,
      },
      team: {
        id: team?.id,
        name: team?.name,
      },
      project: {
        id: project?.id,
        name: project?.name,
      },
      issue: {
        id: issue.id,
        title: issue.title,
        deletedAt: issue?.deletedAt,
      },
      beforeState: {
        status: status && {
          id: status.id,
          name: status.name,
          color: status.color,
        },
        assignee: assignee && {
          id: assignee.id,
          name:
            assignee.name ??
            `${assignee.firstName ?? ""} ${assignee.lastName ?? ""}`.trim(),
          image: assignee.image,
        },
        priority: issue.priority,
      },
      afterState: null,
    };

    activityLogger(loggerData).catch((err) =>
      console.error("Activity log failed:", err),
    );

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
      where: { projectId, deletedAt: null },
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
  async (req: Request, res: Response) => {
    const { sourceId, targetId, workspaceId, teamId } = req.body;

    if (!sourceId || !targetId || !workspaceId || !teamId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "sourceId, targetId, workspaceId and teamId are required.",
      });
    }

    const currentUser = req.userId;

    const issue = await prisma.issue.findUnique({
      where: {
        id: sourceId,
      },
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "ISSUE_NOT_FOUND",
        message: "Issue not found.",
      });
    }

    const previousStatusId = issue.statusId;

    const updatedIssue = await prisma.issue.update({
      where: {
        id: sourceId,
      },
      data: {
        statusId: targetId,
      },
    });

    const [actor, team, project, previousStatus, currentStatus] =
      await Promise.all([
        prisma.user.findUnique({
          where: {
            id: currentUser,
          },
        }),

        prisma.team.findUnique({
          where: {
            id: teamId,
          },
        }),

        prisma.project.findUnique({
          where: {
            id: updatedIssue.projectId,
          },
        }),

        prisma.status.findUnique({
          where: {
            id: previousStatusId,
          },
        }),

        prisma.status.findUnique({
          where: {
            id: targetId,
          },
        }),
      ]);

    const loggerData = {
      action: ActivityAction.STATUS_CHANGED,

      workspaceId,

      actor: {
        id: actor?.id,
        name:
          actor?.name ??
          `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim(),
        image: actor?.image,
      },

      team: {
        id: team?.id,
        name: team?.name,
      },

      project: {
        id: project?.id,
        name: project?.name,
      },

      issue: {
        id: updatedIssue.id,
        title: updatedIssue.title,
        issue: updatedIssue.deletedAt,
      },

      beforeState: {
        status: previousStatus && {
          id: previousStatus.id,
          name: previousStatus.name,
          color: previousStatus.color,
        },
      },

      afterState: {
        status: currentStatus && {
          id: currentStatus.id,
          name: currentStatus.name,
          color: currentStatus.color,
        },
      },
    };

    activityLogger(loggerData).catch((err) =>
      console.error("Activity log failed:", err),
    );

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ISSUE_MOVED",
      message: "Issue moved successfully.",
    });
  },
);
