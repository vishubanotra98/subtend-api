import { Queue } from "bullmq";
import { connection } from "../config/redis.js";

export const deletionQueue = new Queue("deletionQueue", {
  connection,
});
