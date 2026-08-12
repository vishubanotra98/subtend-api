import "../config/env.js";
import { Job, Worker } from "bullmq";
import { DELETION_JOBS } from "../constants/constant.js";
import connection from "../config/redis.js";
import { prisma } from "../lib/prisma.js";

const deletionWorker = new Worker(
  "deletionQueue",
  async (job: Job) => {
    const JOB_NAME = job.name;

    switch (JOB_NAME) {
      case DELETION_JOBS.TEAM_DELETION:
        const { teamId } = job.data;

        const team = await prisma.team.findUnique({
          where: { id: teamId },
        });

        if (!team) {
          return;
        }
        if (!team?.deletedAt) {
          return;
        }

        await prisma.team.delete({
          where: { id: teamId },
        });

        await prisma.team.findFirst({
          where: { id: teamId },
        });

        break;

      case DELETION_JOBS.PROJECT_DELETION:
        break;

      case DELETION_JOBS.WORKSPACE_DELETION:
        break;

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  { connection },
);

deletionWorker.on("active", (job) => {
  console.log(`${job.name} started`);
});

deletionWorker.on("error", (err) => {
  console.error("Worker Error: ", err);
});

deletionWorker.on("completed", (job) => {
  console.log(`${job.name} sent to ${job.data.email}`);
});

// instead of console.error, i can do something later like ---
// send a slack notification
// save the failure to the database
// send logs to sentry
// send logs to datadog

deletionWorker.on("failed", (job, err) => {
  console.error(job?.name);
  console.error(job?.id);
  console.error(err.message);
});
