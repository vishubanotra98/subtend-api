import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import {
  ActivityAction,
  DEFAULT_STATUSES,
  DELETION_JOBS,
} from "../constants/constant.js";
import dayjs from "dayjs";
import { deletionQueue } from "../queue/deletion.queue.js";
import { activityLogger } from "../utils/activityHandler.js";

export const fetchWorkspaceController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.userId;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_USER_ID",
        message: "Invalid or missing userId",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        workspaces: { include: { workspace: true } },
      },
    });

    const adminList = user?.workspaces
      ?.filter((ws) => ws?.role === "ADMIN")
      ?.map((ws) => ws?.workspaceId);

    return res.status(200).json({
      success: true,
      status: 200,
      code: "WORKSPACES_FETCHED",
      message: "Fetched all workspaces.",
      data: {
        workspaces: user?.workspaces,
        adminList,
      },
    });
  },
);

export const fetchWorkspaceMembers = asyncHandler(
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

    const members = await prisma.workspaceMembers.findMany({
      where: { workspaceId },
      select: {
        role: true,
        workspaceId: true,
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "MEMBERS_FETCHED",
      message: "Workspace members fetched successfully.",
      data: { members },
    });
  },
);

export const createWorkspaceController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, workspaceName } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_USER_ID",
        message: "Invalid or missing userId",
      });
    }

    if (!workspaceName) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_WORKSPACE_NAME",
        message: "Invalid or missing workspace name",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        members: {
          create: {
            userId: userId,
            role: "ADMIN",
          },
        },
        statuses: {
          create: DEFAULT_STATUSES.map((status) => ({
            name: status.name,
            color: status.color,
            order: status.order,
            isDefault: status.isDefault,
            isBlocked: status.isBlocked,
            isCompleted: status.isCompleted,
            isInitial: status.isInitial,
            isCancelled: status.isCancelled,
            isInProgress: status.isInProgress,
            isInReview: status.isInReview,
          })),
        },
      },
      include: { statuses: true },
    });

    return res.status(201).json({
      success: true,
      status: 201,
      code: "WORKSPACE_CREATED",
      message: "Workspace created successfully.",
      data: {
        workspace,
      },
    });
  },
);

export const fetchTeamProjectController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params.workspaceId as string;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_WORKSPACE_ID",
        message: "Invalid or missing workspaceId",
      });
    }

    const teamProject = await prisma.team.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      include: {
        projects: {
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "FETCHED_TEAMS",
      message: "Fetched teams and projects successfully.",
      data: {
        teamData: teamProject,
      },
    });
  },
);

export const createTeamController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId, teamName } = req.body;
    const userId = req.userId as string;

    const membership = await prisma.workspaceMembers?.findFirst({
      where: { userId, workspaceId },
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_MEMBER",
        message: "You are not member of this workspace",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        status: 403,
        code: "FORBIDDEN",
        message: "Only admins can create teams",
      });
    }

    const adminMembers = await prisma.workspaceMembers?.findMany({
      where: { workspaceId, role: "ADMIN" },
      select: { userId: true },
    });

    const adminIds = adminMembers?.map((admin) => admin?.userId);
    const teamMemberIds = Array.from(new Set([userId, ...adminIds]));

    await prisma.team.create({
      data: {
        name: teamName,
        workspaceId,
        members: {
          create: teamMemberIds?.map((id) => ({
            userId: id,
          })),
        },
      },
    });

    return res.status(201).json({
      success: true,
      status: 201,
      code: "TEAM_CREATED",
      message: "Team created successfully.",
    });
  },
);

export const createProjectController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const { teamId, projectName, projectOverview, targetDate } = req.body;

    if (!teamId || !projectName) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "teamId and projectName are required",
      });
    }

    const membership = await prisma.teamMembers.findFirst({
      where: { teamId, userId },
      include: { team: true },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        status: 403,
        code: "NOT_A_MEMBER",
        message: "You must be a member of this team to create a project.",
      });
    }

    const workspaceId = membership?.team?.workspaceId;
    const workspaceUser = await prisma.workspaceMembers.findFirst({
      where: { workspaceId, userId },
    });

    if (workspaceUser?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        status: 403,
        code: "FORBIDDEN",
        message: "You must be an admin to create a project.",
      });
    }

    const project = await prisma.project.create({
      data: {
        name: projectName,
        teamId,
        projectOverview,
        targetDate,
      },
    });

    return res.status(201).json({
      success: true,
      status: 201,
      code: "PROJECT_CREATED",
      message: "Project created successfully.",
      data: { project },
    });
  },
);

export const fetchProjectByIdController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    if (typeof projectId !== "string" || !projectId) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "PROJECT_ID MISSING",
        message: "Project id is missing.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null, team: { deletedAt: null } },
      include: { team: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "PROJECT NOT FOUND",
        message:
          "Project with this project id is either deleted or does not exist.",
      });
    }

    return res.status(200).json({
      success: true,
      status: 201,
      code: "PROJECT_FETCHED",
      message: "Project fetched successfully.",
      data: { project },
    });
  },
);

// export const lastActiveWorkspaceController = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = req.userId;
//     const workspaceId = req.params?.workspaceId as string;

//     if (!workspaceId) {
//       return res.status(400).json({
//         success: false,
//         status: 400,
//         code: "MISSING_FIELDS",
//         message: "workspaceId is required",
//       });
//     }

//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         lastActiveWorkspaceId: workspaceId,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       status: 200,
//       code: "LAST_ACTIVE_WORKSPACE_UPDATED",
//       message: "Last active workspace updated successfully.",
//     });
//   },
// );

export const fetchStatusController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const projectId = req.query.projectId as string;
    let statusList = null;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_WORKSPACE_ID",
        status: 400,
        message: "Invalid Workspace Id",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        code: "WORKSPACE_NOT_FOUND",
        status: 404,
        message: "Workspace does not exist.",
      });
    }

    if (!projectId) {
      statusList = await prisma.status.findMany({
        where: { workspaceId },
        include: {
          _count: {
            select: { issues: true },
          },
        },
      });
    } else {
      statusList = await prisma.status.findMany({
        where: { workspaceId },
        include: {
          _count: {
            select: { issues: { where: { projectId } } },
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      code: "STATUS_FETCHED",
      status: 200,
      message: "Status fetched.",
      data: {
        status: statusList,
      },
    });
  },
);

export const fetchProjectsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_WORKSPACE_ID",
        status: 400,
        message: "Invalid Workspace Id",
      });
    }

    const projects = await prisma.project.findMany({
      where: { team: { workspace: { id: workspaceId } }, deletedAt: null },
    });

    if (!projects) {
      return res.status(404).json({
        success: false,
        code: "NO_PROJECTS_FOUND",
        status: 404,
        message: "No Projects found.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "PROJECTS_FETCHED",
      status: 200,
      message: "Projects fetched.",
      data: {
        projects,
      },
    });
  },
);

export const deleteTeamController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teamId } = req.params;

    if (!teamId || typeof teamId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_TEAM_ID",
        status: 400,
        message: "A valid team ID is required.",
      });
    }

    const actorId = req.userId;
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
      },
    });

    if (!actor) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        status: 401,
        message: "User authentication is required.",
      });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        code: "TEAM_NOT_FOUND",
        status: 404,
        message: "Team not found or has already been deleted.",
      });
    }

    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.team.update({
        where: { id: teamId, deletedAt: null },
        data: { deletedAt },
      }),
      prisma.project.updateMany({
        where: { team: { id: teamId }, deletedAt: null },
        data: { deletedAt },
      }),

      prisma.issue.updateMany({
        where: { project: { team: { id: teamId } }, deletedAt: null },
        data: { deletedAt },
      }),
    ]);

    const loggerData = {
      action: ActivityAction.TEAM_DELETE,
      workspaceId: team?.workspaceId,
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
        deletedAt,
      },
    };

    activityLogger(loggerData).catch((err) =>
      console.error("Activity log failed:", err),
    );

    const data = { teamId: team?.id, deletedAt };

    await deletionQueue.add(DELETION_JOBS.TEAM_DELETION, data, {
      delay: 20 * 60 * 1000,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    });

    return res.status(200).json({
      success: true,
      code: "TEAM_DELETION_SCHEDULED",
      status: 200,
      message: "Team has been scheduled for permanent deletion.",
    });
  },
);

export const deleteProjectController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_PROJECT_ID",
        status: 400,
        message: "A valid project ID is required.",
      });
    }

    const actorId = req.userId;

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
      },
    });

    if (!actor) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        status: 401,
        message: "User authentication is required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: { id: true, name: true, team: { select: { workspaceId: true } } },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        code: "PROJECT_NOT_FOUND",
        status: 404,
        message: "Project not found or has already been deleted.",
      });
    }

    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.project.update({
        where: {
          id: projectId,
          deletedAt: null,
        },
        data: {
          deletedAt,
        },
      }),

      prisma.issue.updateMany({
        where: {
          project: {
            id: projectId,
          },
          deletedAt: null,
        },
        data: {
          deletedAt,
        },
      }),
    ]);

    const loggerData = {
      action: ActivityAction.PROJECT_DELETE,
      workspaceId: project.team.workspaceId,
      actor: {
        id: actor.id,
        name:
          actor.name ??
          `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim(),
        image: actor.image,
      },
      project: {
        id: project.id,
        name: project.name,
        deletedAt,
      },
    };

    activityLogger(loggerData).catch((err) =>
      console.error("Activity log failed:", err),
    );

    const data = {
      projectId: project?.id,
      projectDeletedAt: deletedAt.toISOString(),
    };

    await deletionQueue.add(DELETION_JOBS.PROJECT_DELETION, data, {
      delay: 2 * 60 * 1000,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    });

    return res.status(200).json({
      success: true,
      code: "PROJECT_DELETION_SCHEDULED",
      status: 200,
      message: "Project has been scheduled for permanent deletion.",
    });
  },
);

export const fetchSoftDeletedTeamsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_WORKSPACE_ID",
        status: 400,
        message: "A valid Workspace ID is required.",
      });
    }

    const teams = await prisma.team.findMany({
      where: {
        workspace: { id: workspaceId },
        deletedAt: {
          not: null,
        },
      },
      include: {
        projects: {
          where: {
            deletedAt: {
              not: null,
            },
          },
          select: {
            id: true,
            name: true,
            teamId: true,
          },
        },
      },
    });

    if (!teams) {
      return res.status(404).json({
        success: false,
        code: "DELETED_TEAM_NOT_FOUND",
        status: 404,
        message: "Deleted Teams not found.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "DELETED_TEAMS_FETCHED",
      status: 200,
      message: "Deleted teams fetched",
      data: { teams },
    });
  },
);

export const fetchSoftDeletedProjectsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_PROJECT_ID",
        status: 400,
        message: "A valid project ID is required.",
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        team: { workspaceId },
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        team: { select: { name: true, id: true } },
      },
    });

    if (!projects) {
      return res.status(404).json({
        success: false,
        code: "DELETED_PROJECT_NOT_FOUND",
        status: 404,
        message: "No deleted projects found.",
      });
    }

    return res.status(200).json({
      success: true,
      code: "DELETED_PROJECTS_FETCHED",
      status: 200,
      message: "Deleted projects fetched.",
      data: { projects },
    });
  },
);

export const restoreProjectController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_PROJECT_ID",
        status: 400,
        message: "A valid project ID is required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        code: "PROJECT_NOT_FOUND",
        status: 404,
        message: "Project not found.",
      });
    }

    if (!project.deletedAt) {
      return res.status(409).json({
        success: false,
        code: "PROJECT_NOT_DELETED",
        status: 409,
        message: "Project is already active.",
      });
    }

    const restoredProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { deletedAt: null },
      });

      await tx.issue.updateMany({
        where: {
          projectId,
          deletedAt: {
            not: null,
          },
        },
        data: {
          deletedAt: null,
        },
      });

      return project;
    });

    return res.status(200).json({
      success: true,
      code: "PROJECT_RESTORED",
      status: 200,
      message: "Project restored.",
      data: { project: restoredProject },
    });
  },
);

export const restoreTeamController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teamId } = req.params;

    if (!teamId || typeof teamId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_TEAM_ID",
        status: 400,
        message: "A valid Team ID is required.",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        code: "TEAM_NOT_FOUND",
        status: 404,
        message: "Team not found.",
      });
    }

    if (!team.deletedAt) {
      return res.status(409).json({
        success: false,
        code: "TEAM_NOT_DELETED",
        status: 409,
        message: "Team is already active.",
      });
    }

    const restoredTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.update({
        where: { id: teamId },
        data: { deletedAt: null },
      });

      await tx.project.updateMany({
        where: {
          teamId,
          deletedAt: {
            not: null,
          },
        },
        data: {
          deletedAt: null,
        },
      });

      await tx.issue.updateMany({
        where: { project: { teamId }, deletedAt: { not: null } },
        data: { deletedAt: null },
      });

      return team;
    });

    return res.status(200).json({
      success: true,
      code: "TEAM_RESTORED",
      status: 200,
      message: "Team restored.",
      data: { team: restoredTeam },
    });
  },
);

export const permanentlyDeleteProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_PROJECT_ID",
        status: 400,
        message: "A valid project ID is required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        code: "PROJECT_NOT_FOUND",
        status: 404,
        message: "Project not found.",
      });
    }

    if (!project.deletedAt) {
      return res.status(409).json({
        success: false,
        code: "PROJECT_NOT_DELETED",
        status: 409,
        message: "Project is active and cannot be permanently deleted.",
      });
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return res.status(200).json({
      success: true,
      code: "PROJECT_PERMANENTLY_DELETED",
      status: 200,
      message: "Project permanently deleted.",
    });
  },
);

export const permanentlyDeleteTeamController = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId } = req.params;

    if (!teamId || typeof teamId !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_TEAM_ID",
        status: 400,
        message: "A valid Team ID is required.",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        code: "TEAM_NOT_FOUND",
        status: 404,
        message: "Team not found.",
      });
    }

    if (!team.deletedAt) {
      return res.status(409).json({
        success: false,
        code: "TEAM_NOT_DELETED",
        status: 409,
        message: "Team is active and cannot be permanently deleted.",
      });
    }

    await prisma.team.delete({
      where: {
        id: teamId,
      },
    });

    return res.status(200).json({
      success: true,
      code: "TEAM_PERMANENTLY_DELETED",
      status: 200,
      message: "Team permanently deleted.",
    });
  },
);
