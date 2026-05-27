import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgon from "morgan";
import cookieParser from "cookie-parser";
import { BASE_URL_CLIENT } from "./constants/constant.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Route Imports
import healthCheckRoute from "./routes/health.route.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import workspaceRoutes from "./routes/workspace.route.js";
import issueRoutes from "./routes/issue.route.js";

const app = express();

if (process.env.NODE_ENV != "production") {
  app.use(morgon("dev"));
}

app.use(cookieParser());
app.use(
  cors({
    origin: [BASE_URL_CLIENT, "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());

export const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: [BASE_URL_CLIENT, "http://localhost:3000"],
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
  },
});

// healthCheckRoute
app.use("/api/v1", healthCheckRoute);

// Auth Routes
app.use("/auth", authRoutes);

// user routes
app.use("/api/v1", userRoutes);

// Workspace Routes
app.use("/api/v1", workspaceRoutes);

// issue routes
app.use("/api/v1", issueRoutes);

app.use(errorHandler);
export default app;
