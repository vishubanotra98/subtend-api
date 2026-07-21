import { Redis } from "ioredis";

const REDIS_CONNECTION_STRING = process.env.REDIS_URL;

const connection = new Redis(REDIS_CONNECTION_STRING, {
  maxRetriesPerRequest: null,
});

export default connection;
