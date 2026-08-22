"https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=repo";

import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export const githubLoginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: "http://localhost:8080/auth/github/callback"!,
      scope: "repo",
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  },
);

export const githubCallBackController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code;

    if (!code) {
      return res.json({
        message: "Error",
      });
    }

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: "http://localhost:8080/auth/github/callback",
        }),
      },
    );
    const data = await response.json();
    const accessToken = data.access_token;
    console.log("DATA: ", data);

    return res.redirect(
      `http://localhost:3000/integration?githubconnected=true&${code}`,
    );
  },
);
