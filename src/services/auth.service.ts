import express from "express";
import {
  googleLogin,
  login,
  signUpEmail,
  signUpToken,
  forgotPasswordEmail,
  forgotPasswordToken,
  forgotPasswordNew,
  signupResendToken,
  refreshToken,
} from "../controllers/auth.controller";
import { SignUpEmailValidator } from "../validators/auth/signup/signup-email.validator";
import { SignUpTokenValidator } from "../validators/auth/signup/signup-token.validator";
import { LoginValidator } from "../validators/auth/login/login.validator";
import { ForgotPasswordEmailValidator } from "../validators/auth/forgot-password/forgot-password-email.validator";
import { ForgotPasswordTokenValidator } from "../validators/auth/forgot-password/forgot-password-token.validator";
import { ForgotPasswordNewValidator } from "../validators/auth/forgot-password/forgot-password-new.validator";
import { SignUpTokenResendValidator } from "../validators/auth/signup/signup-token-resend-validator";
import { RefreshTokenValidator } from "../validators/auth/shared/refresh-token.validator";

const authRouter = express.Router();

authRouter.post("/signup/email", SignUpEmailValidator, signUpEmail);
authRouter.post("/signup/token", SignUpTokenValidator, signUpToken);
authRouter.post(
  "/signup/token-resend",
  SignUpTokenResendValidator,
  signupResendToken,
);

authRouter.post("/login", LoginValidator, login);
authRouter.post("/google-login", googleLogin);

authRouter.post("/refresh-token", RefreshTokenValidator, refreshToken);

// This endpoint is used for resend token too
authRouter.post(
  "/forgot-password/email",
  ForgotPasswordEmailValidator,
  forgotPasswordEmail,
);
authRouter.post(
  "/forgot-password/token",
  ForgotPasswordEmailValidator,
  ForgotPasswordTokenValidator,
  forgotPasswordToken,
);
authRouter.post(
  "/forgot-password/new",
  ForgotPasswordEmailValidator,
  ForgotPasswordTokenValidator,
  ForgotPasswordNewValidator,
  forgotPasswordNew,
);

export default authRouter;
