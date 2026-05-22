import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  changeRoleController,
  fetchUserController,
  inviteUserController,
  removeUserFromWorkspaceController,
  verifyInviteMemberController,
} from "../controller/user.controller.js";

const router = Router();

router.get("/user", authMiddleware, fetchUserController);
router.post("/member-invite", authMiddleware, inviteUserController);
router.post("/verify-invite", verifyInviteMemberController);
router.post("/change-role", authMiddleware, changeRoleController);
router.delete(
  "/remove-user",
  authMiddleware,
  removeUserFromWorkspaceController,
);

export default router;
