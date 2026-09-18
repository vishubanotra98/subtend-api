import express from "express";
import { createServer } from "http";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { ALLOWED_ORIGINS } from "./constants/constant.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Route Imports
import healthCheckRoute from "./routes/health.route.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import workspaceRoutes from "./routes/workspace.route.js";
import issueRoutes from "./routes/issue.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import githubRoutes from "./routes/github.routes.js";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(cookieParser());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json());

export const server = createServer(app);

app.use("/api/v1", healthCheckRoute);
app.use("/auth", authRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", workspaceRoutes);
app.use("/api/v1", issueRoutes);
app.use("/api/v1", dashboardRoutes);
app.use("/api/v1", githubRoutes);

app.use(errorHandler);

export default app;
