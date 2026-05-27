import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { issueTokens } from "../helpers/cookie.helper.js";

const GOOGLE_ISSUER = "https://accounts.google.com";

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

    if (!profile.sub || !profile.email) {
      return res.status(401).json({
        success: false,
        status: 401,
        code: "GOOGLE_PROFILE_FAILED",
        message: "Failed to fetch Google profile.",
      });
    }

    const existingCredential = await prisma.federatedCredential.findUnique({
      where: {
        provider_subject: {
          provider: GOOGLE_ISSUER,
          subject: profile.sub,
        },
      },
      include: { user: true },
    });

    let user;

    if (!existingCredential) {
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerified: true,
            image: existingUser.image ?? profile.picture ?? null,
            firstName: existingUser.firstName ?? profile.given_name ?? null,
            lastName: existingUser.lastName ?? profile.family_name ?? null,
            federatedCredentials: {
              create: {
                provider: GOOGLE_ISSUER,
                subject: profile.sub,
              },
            },
          },
        });
      } else {
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
      }
    } else {
      user = existingCredential.user;
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
