import jwt from "jsonwebtoken";
import type { IncomingMessage } from "node:http";

import { ACCESS_TOKEN_SECRET } from "../constants/constant.js";

function parseCookies(
  cookieString: string | undefined,
): Record<string, string> {
  if (!cookieString) return {};

  return cookieString
    .split(";")
    .reduce<Record<string, string>>((cookies, cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex === -1) return cookies;

      const key = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();

      if (key && value) {
        cookies[key] = decodeURIComponent(value);
      }

      return cookies;
    }, {});
}

export const tokenVerification = (req: IncomingMessage): string | undefined => {
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.access_token;

  if (!accessToken) return undefined;

  try {
    const decodedData = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);

    if (typeof decodedData !== "object" || decodedData === null) {
      return undefined;
    }

    const { user_id } = decodedData;

    if (typeof user_id !== "string" || !user_id.trim()) {
      return undefined;
    }

    return user_id;
  } catch (error) {
    console.error("[WS] Token verification failed:", error);
    return undefined;
  }
};
