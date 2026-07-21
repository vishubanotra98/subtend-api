import "../config/env.js";

import { Job, Worker } from "bullmq";
import connection from "../config/redis.js";
import {
  emailInvitationService,
  emailVerificationService,
} from "../services/email.service.js";
import { EMAIL_JOBS } from "../constants/constant.js";

const emailWorker = new Worker(
  "emailQueue",
  async (job: Job) => {
    switch (job.name) {
      case EMAIL_JOBS.VERIFICATION: {
        const { email, firstName, verificationToken } = job.data;

        await emailVerificationService({
          email,
          firstName,
          verificationToken,
        });
        break;
      }

      case EMAIL_JOBS.INVITATION: {
        const { email, token, workspaceId, role } = job.data;

        await emailInvitationService({
          email,
          token,
          workspaceId,
          role,
        });
        break;
      }

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  { connection },
);

emailWorker.on("active", (job) => {
  console.log(`${job.name} started`);
});

emailWorker.on("error", (err) => {
  console.error("Worker Error: ", err);
});

emailWorker.on("completed", (job) => {
  console.log(`${job.name} sent to ${job.data.email}`);
});

// instead of console.error, i can do something later like ---
// send a slack notification
// save the failure to the database
// send logs to sentry
// send logs to datadog

emailWorker.on("failed", (job, err) => {
  console.error(job?.name);
  console.error(job?.id);
  console.error(err.message);
});
