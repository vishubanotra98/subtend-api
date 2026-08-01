import { prisma } from "../lib/prisma.js";

export const activityLogger = async (data: any) => {
  try {
    const res = await prisma.activity.create({
      data: {
        action: data?.action,
        workspaceId: data?.workspaceId,
        actor: data?.actor,
        team: data?.team,
        project: data?.project,
        issue: data?.issue,
        beforeState: data?.beforeState || null,
        afterState: data?.afterState || null,
      },
    });
    return res;
  } catch (error) {
    return error;
  }
};
