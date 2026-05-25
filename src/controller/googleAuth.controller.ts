import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from "../constants/constant.js";

const GOOGLE_ISSUER = "https://accounts.google.com";

const issueTokens = async (res: Response, userId: string, email: string) => {
  const payload = { user_id: userId, email };

  const access_token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refresh_token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });

  await prisma.refreshToken.create({
    data: {
      token: refresh_token,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.cookie("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
};

// step 1 - redirecting user to google
export const googleLoginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    );
  },
);

// step 2 - google redirects back with code
export const googleCallbackController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        status: 400,
        code: "NO_AUTH_CODE",
        message: "No authorization code provided.",
      });
    }

    // exchange code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "GOOGLE_AUTH_FAILED",
        message: "Failed to authenticate with Google.",
      });
    }

    // fetch user profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    const profile = await profileRes.json();

    if (!profile.sub) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "GOOGLE_PROFILE_FAILED",
        message: "Failed to fetch Google profile.",
      });
    }

    const existing = await prisma.federatedCredential.findUnique({
      where: {
        provider_subject: {
          provider: GOOGLE_ISSUER,
          subject: profile.sub,
        },
      },
      include: { user: true },
    });

    let user;

    if (!existing) {
      user = await prisma.user.create({
        data: {
          firstName: profile.given_name ?? null,
          lastName: profile.family_name ?? null,
          email: profile.email,
          image: profile.picture ?? null,
          emailVerified: true,
          password: null,
          federatedCredentials: {
            create: {
              provider: GOOGLE_ISSUER,
              subject: profile.sub,
            },
          },
        },
      });
    } else {
      user = existing.user;
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        status: 500,
        code: "USER_FETCH_FAILED",
        message: "Something went wrong.",
      });
    }

    await issueTokens(res, user.id, user.email!);

    return res.redirect(`${process.env.BASE_URL_CLIENT}`);
  },
);
