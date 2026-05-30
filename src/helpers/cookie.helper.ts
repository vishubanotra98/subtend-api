import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from "../constants/constant.js";

const cookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: "/",
  maxAge,
});

export const issueTokens = async (
  res: Response,
  userId: string,
  email: string,
) => {
  const payload = { user_id: userId, email };

  const access_token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refresh_token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });

  await prisma.refreshToken.upsert({
    where: { userId },
    update: {
      token: refresh_token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      token: refresh_token,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie("access_token", access_token, cookieOptions(15 * 60 * 1000));
  res.cookie(
    "refresh_token",
    refresh_token,
    cookieOptions(30 * 24 * 60 * 60 * 1000),
  );

  return { access_token, refresh_token };
};
