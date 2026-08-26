import { prisma } from "../lib/prisma.js";

export async function getValidAccessToken(
  workspaceId: string,
): Promise<string> {
  const integration = await prisma.githubIntegration.findUnique({
    where: { workspaceId },
  });

  if (!integration) {
    throw new Error("GITHUB_NOT_CONNECTED");
  }

  const bufferMs = 60 * 1000;
  if (
    new Date(integration.accessTokenExpireAt).getTime() - bufferMs >
    Date.now()
  ) {
    return integration.access_token;
  }

  if (new Date(integration.refreshTokenExpireAt).getTime() <= Date.now()) {
    throw new Error("GITHUB_REAUTH_REQUIRED");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: integration.refresh_token,
    }),
  });

  const data = await response.json();

  if (data?.error) {
    throw new Error("GITHUB_REAUTH_REQUIRED");
  }

  const accessTokenExpireAt = new Date(Date.now() + data.expires_in * 1000);
  const refreshTokenExpireAt = new Date(
    Date.now() + data.refresh_token_expires_in * 1000,
  );

  const updated = await prisma.githubIntegration.update({
    where: { workspaceId },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      accessTokenExpireAt,
      refreshTokenExpireAt,
    },
  });

  return updated.access_token;
}
