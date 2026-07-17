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
import { GoogleLoginValidator } from "../validators/auth/login/google-login.validator";

const authRouter = express.Router();

/**
 * @openapi
 * /auth/signup/email:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new unverified user and sends a verification email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpEmailRequestSchema'
 *     responses:
 *       200:
 *         description: User created successfully.
 */
authRouter.post("/signup/email", SignUpEmailValidator, signUpEmail);

/**
 * @openapi
 * /auth/signup/token:
 *   post:
 *     summary: Verifies a user's email
 *     description: Verifies a user's email and sends the user, access token and refresh token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpTokenRequestSchema'
 *     responses:
 *       200:
 *         description: User's email verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponseSchema'
 */
authRouter.post("/signup/token", SignUpTokenValidator, signUpToken);

/**
 * @openapi
 * /auth/signup/token-resend:
 *   post:
 *     summary: Resends a new verification token
 *     description: Generates a new token and sets it in the user's document and sends it to the user's email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpTokenResendRequestSchema'
 *     responses:
 *       200:
 *         description: A new token has been sent.
 */
authRouter.post(
  "/signup/token-resend",
  SignUpTokenResendValidator,
  signupResendToken,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Logs in a user
 *     description: Logs in a user and sends the user, access token and refresh token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequestSchema'
 *     responses:
 *       200:
 *         description: User logged in successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponseSchema'
 */
authRouter.post("/login", LoginValidator, login);

/**
 * @openapi
 * /auth/google-login:
 *   post:
 *     summary: Logs in a user using google
 *     description: Logs in a user using google and sends the user, access token and refresh token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequestSchema'
 *     responses:
 *       200:
 *         description: User logged in using google successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponseSchema'
 */
authRouter.post("/google-login", GoogleLoginValidator, googleLogin);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Creates a new access token
 *     description: When the user's access token expires, the client calls this endpoint to get a new access token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequestSchema'
 *     responses:
 *       200:
 *         description: A new access token has been created and sent.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponseSchema'
 */
authRouter.post("/refresh-token", RefreshTokenValidator, refreshToken);

/**
 * @openapi
 * /auth/forgot-password/email:
 *   post:
 *     summary: Starts the forgot password process
 *     description: Sends the verification token to the user's email. This endpoint is used for resend token too.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordEmailRequestSchema'
 *     responses:
 *       200:
 *         description: The reset token has been sent.
 */
authRouter.post(
  "/forgot-password/email",
  ForgotPasswordEmailValidator,
  forgotPasswordEmail,
);

/**
 * @openapi
 * /auth/forgot-password/token:
 *   post:
 *     summary: Verifies the reset token
 *     description: Verifies the reset token and allows the user to go to the new password step.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordTokenRequestSchema'
 *     responses:
 *       200:
 *         description: The reset token has been verified.
 */
authRouter.post(
  "/forgot-password/token",
  ForgotPasswordEmailValidator,
  ForgotPasswordTokenValidator,
  forgotPasswordToken,
);

/**
 * @openapi
 * /auth/forgot-password/new:
 *   post:
 *     summary: Resets the user's password
 *     description: Finishes the reset password process by allowing the user to set a new password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordNewRequestSchema'
 *     responses:
 *       200:
 *         description: The password has been reset.
 */
authRouter.post(
  "/forgot-password/new",
  ForgotPasswordEmailValidator,
  ForgotPasswordTokenValidator,
  ForgotPasswordNewValidator,
  forgotPasswordNew,
);

export default authRouter;
