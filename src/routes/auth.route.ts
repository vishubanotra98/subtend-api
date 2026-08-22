import { Router } from "express";
import {
  emailVerificationController,
  logout,
  refresh,
  signInController,
  signUpController,
} from "../controller/auth.controller.js";
import {
  googleCallbackController,
  googleLoginController,
} from "../controller/googleAuth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  githubCallBackController,
  githubLoginController,
} from "../controller/githubAuthController.js";

const router = Router();

router.post("/signup", signUpController);
router.post("/signin", signInController);
router.post("/refresh", refresh);
router.post("/verification", emailVerificationController);

// Google Oauth
router.get("/login/google", googleLoginController);
router.get("/oauth2/redirect/google", googleCallbackController);

// github
router.get("/login/github", githubLoginController);
router.get("/github/callback", githubCallBackController);

// logout
router.post("/logout", authMiddleware, logout);

export default router;
