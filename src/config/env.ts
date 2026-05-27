import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

config({
  path: [
    resolve(projectRoot, ".env"),
    resolve(projectRoot, "src/.env"),
    resolve(projectRoot, "src/prisma/.env"),
  ],
  quiet: true,
});
