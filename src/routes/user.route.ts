import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  fetchUserController,
  inviteUserController,
  verifyInviteMemberController,
} from "../controller/user.controller.js";

const router = Router();

router.get("/user", authMiddleware, fetchUserController);
router.post("/member-invite", authMiddleware, inviteUserController);
router.post("/verify-invite", verifyInviteMemberController);

export default router;
