import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  decryptHashedPassowrd,
  passwordHash,
} from "../helpers/passwordHashing.js";
import { prisma } from "../lib/prisma.js";
import { resend } from "../lib/emailService.js";
import { signInSchema, userSchema } from "../lib/schema.js";
import Email from "../emails/templates/VerificationEmail.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from "../constants/constant.js";
import { cookieOptions, issueTokens } from "../helpers/cookie.helper.js";

const isProduction = process.env.NODE_ENV === "production";

export const signUpController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { formData, token, isAdmin } = req.body;
    const validatedData = userSchema.parse(formData);

    const hashedPassword = await passwordHash(validatedData?.password);

    const verificationToken = Math.floor(
      100000 + Math.random() * 999999,
    ).toString();
    const tokenExpiryDate = new Date(Date.now() + 15 * 60 * 1000); //15 min

    if (token) {
      const ifUserExists = await prisma.invitation.findUnique({
        where: { email: validatedData?.email, token: token },
      });

      if (!ifUserExists) {
        return res?.status(400).json({
          success: false,
          status: 400,
          code: "INVALID_USER",
          message: "Invalid User.",
        });
      }

      const workspaceId = ifUserExists?.workspaceId;

      const user = await prisma.user.create({
        data: {
          firstName: validatedData?.firstName,
          lastName: validatedData?.lastName,
          email: ifUserExists.email,
          password: hashedPassword,
          emailVerified: true,
          verificationToken: null,
          tokenExpiry: null,
          workspaces: {
            create: {
              workspaceId: ifUserExists?.workspaceId,
              role: !isAdmin ? "MEMBER" : "ADMIN",
            },
          },
        },
      });

      await prisma.invitation.delete({
        where: { id: ifUserExists?.id },
      });

      return res.status(201).json({
        success: true,
        status: 201,
        code: "USER_REGISTERED",
        message: "User regisetred.",
        data: { email: user.email, invited: true, workspaceId },
      });
    } else {
      const existingUser = await prisma.user.findFirst({
        where: { email: validatedData.email },
      });

      if (existingUser?.emailVerified) {
        return res.status(409).json({
          success: false,
          status: 409,
          code: "USER_ALREADY_EXISTS",
          message: "User with this email already exists.",
        });
      } else {
        await prisma.user.upsert({
          where: { email: validatedData.email },
          update: {
            password: hashedPassword,
            verificationToken: verificationToken.trim(),
            tokenExpiry: tokenExpiryDate,
          },
          create: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            password: hashedPassword,
            tokenExpiry: tokenExpiryDate,
            emailVerified: false,
            verificationToken: verificationToken,
          },
        });
        await resend.emails.send({
          from: "TaskFlow <verification@taskflow.vishubanotra.xyz>",
          to: [validatedData.email],
          subject: "TaskFlow Verification OTP",
          react: Email({
            firstName: validatedData.firstName,
            email: validatedData.email,
            verificationToken: verificationToken,
          }),
        });

        return res.status(200).json({
          success: true,
          status: 200,
          code: "OTP_SENT",
          message: "OTP sent to the registered email.",
          data: { email: validatedData.email },
        });
      }
    }
  },
);

export const signInController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const validatedData = signInSchema.parse({ email, password });

    const user = await prisma?.user?.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    const hashedPassword = user?.password as string;
    const checkPassword = await decryptHashedPassowrd(
      validatedData?.password,
      hashedPassword,
    );

    if (!checkPassword) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    if (!user?.emailVerified) {
      return res?.status(403)?.json({
        success: false,
        status: 403,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email to continue",
      });
    }

    await issueTokens(res, user.id, user.email);

    return res?.status(200)?.json({
      success: true,
      status: 200,
      code: "LOGGED_IN",
      message: "User logged in.",
      data: {
        user_id: user?.id,
        email: user?.email,
      },
    });
  },
);

export const emailVerificationController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        status: 404,
        code: "INVALID_VERIFICATION",
        message: "Invalid email.",
      });
    }

    if (user.verificationToken.trim() !== otp.trim()) {
      return res.status(400).json({
        success: false,
        status: 401,
        code: "INVALID_OTP",
        message: "Incorrect verification code.",
      });
    }

    if (!user.tokenExpiry || new Date() > user.tokenExpiry) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "OTP_EXPIRED",
        message: "Code expired. Please sign up again.",
      });
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationToken: null,
        tokenExpiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      code: "USER_VERIFIED",
      message: "Verification Successfull.",
      data: { verified: true },
    });
  },
);

export const refresh = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "NO_REFRESH_TOKEN",
        message: "Please login to continue.",
      });
    }

    let userData: JwtPayload;
    try {
      userData = jwt.verify(refresh_token, REFRESH_TOKEN_SECRET) as JwtPayload;
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        status: 401,
        code:
          err.name === "TokenExpiredError"
            ? "REFRESH_TOKEN_EXPIRED"
            : "INVALID_REFRESH_TOKEN",
        message: "Please login to continue.",
      });
    }

    const tokenPresent = await prisma.refreshToken.findFirst({
      where: { token: refresh_token, userId: userData?.user_id },
    });

    if (!tokenPresent) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
        message: "Please login to continue.",
      });
    }

    await issueTokens(res, userData.user_id, userData.email);

    return res.status(200).json({
      success: true,
      status: 200,
      code: "TOKEN_REFRESHED",
      message: "Token refreshed successfully.",
    });
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refresh_token = req.cookies.refresh_token;

  if (refresh_token) {
    await prisma.refreshToken.deleteMany({
      where: { token: refresh_token },
    });
  }

  res.clearCookie("access_token", cookieOptions(0));
  res.clearCookie("refresh_token", cookieOptions(0));

  return res.status(200).json({
    success: true,
    status: 200,
    code: "USER_LOGGED_OUT",
    message: "User logged out successfully.",
  });
});
