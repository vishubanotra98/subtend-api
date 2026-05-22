import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { DEFAULT_STATUSES } from "../constants/constant.js";
import { v4 as uuid } from "uuid";
import { resend } from "../lib/emailService.js";
import UserInvitation from "../emails/templates/UserInvitation.js";

export const fetchUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "User ID is missing from the request.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        lastActiveWorkspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      code: "USER_DETAILS_FETCHED",
      message: "User details fetched successfully.",
      data: {
        user,
      },
    });
  },
);

export const inviteUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, workspaceId, role } = req.body;

    if (!email || !workspaceId || !role) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "Email, workspaceId and role are required",
      });
    }

    const isUserExists = await prisma.user.findUnique({
      where: { email },
    });

    if (isUserExists) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "USER_ALREADY_EXISTS",
        message: "User is already registered.",
      });
    }

    const token = uuid();
    const tokenExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.invitation.upsert({
      where: {
        email_workspaceId: { email, workspaceId },
      },
      update: {
        token,
        expires: tokenExpiryDate,
        status: "PENDING",
      },
      create: {
        email,
        token,
        workspaceId,
        expires: tokenExpiryDate,
        status: "PENDING",
      },
    });

    await resend.emails.send({
      from: "TaskFlow <onboarding@taskflow.vishubanotra.xyz>",
      to: [email],
      subject: "Join your team on Taskflow",
      react: UserInvitation({ email, token, workspaceId, role }),
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "INVITATION_SENT",
      message: "Invitation sent successfully.",
    });
  },
);

export const verifyInviteMemberController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, token } = req.body;

    console.log("EMAIL: ", email);
    console.log("TOKEN: ", token);

    if (!token || !email) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "INVALID_USER",
        message: "Invalid User.",
      });
    }

    const existingInvite = await prisma.invitation.findUnique({
      where: { token: token },
    });

    if (!existingInvite) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "INVALID_TOKEN",
        message: "Invalid invitation token.",
      });
    }

    if (existingInvite.email !== email) {
      return res.status(403).json({
        success: false,
        status: 403,
        code: "EMAIL_MISMATCH",
        message: "This invitation belongs to a different email address.",
      });
    }

    const hasExpired = new Date(existingInvite.expires) < new Date();
    if (hasExpired) {
      return res.status(410).json({
        success: false,
        status: 410,
        code: "INVITATION_EXPIRED",
        message: "Invitation has expired.",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      code: "MEMBER_VERIFIED",
      message: "Member verified successfully.",
    });
  },
);

export const changeRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workspaceId, targetUserId, role } = req.body;
    const userId = req.userId;

    if (!workspaceId || !targetUserId || !role) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "MISSING_FIELDS",
        message: "workspaceId, targetUserId and role are required.",
      });
    }

    const currentUser = await prisma.workspaceMembers.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "MEMBERSHIP_NOT_FOUND",
        message: "You are not a member of this workspace.",
      });
    }

    if (currentUser.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        status: 403,
        code: "ACCESS_DENIED",
        message: "Only workspace administrators can change member roles.",
      });
    }

    const validRoles = ["MEMBER", "ADMIN"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "INVALID_ROLE",
        message: "Role must be MEMBER or ADMIN.",
      });
    }

    const targetMember = await prisma.workspaceMembers.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        status: 404,
        code: "TARGET_MEMBER_NOT_FOUND",
        message: "Target user is not a member of this workspace.",
      });
    }

    await prisma.workspaceMembers.update({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      data: {
        role,
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "ROLE_CHANGED",
      message: "Role changed successfully.",
    });
  },
);
