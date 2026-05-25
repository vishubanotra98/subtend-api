import { Router } from "express";
import {
  emailVerificationController,
  refresh,
  signInController,
  signUpController,
} from "../controller/auth.controller.js";
import {
  googleCallbackController,
  googleLoginController,
} from "../controller/googleAuth.controller.js";

const router = Router();

router.post("/signup", signUpController);
router.post("/signin", signInController);
router.post("/refresh", refresh);
router.post("/verification", emailVerificationController);

// Google Oauth
router.get("/login/google", googleLoginController);
router.get("/oauth2/redirect/google", googleCallbackController);

export default router;
