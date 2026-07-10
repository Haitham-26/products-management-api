import express from "express";
import {
  getUserById,
  resetPassword,
  updateUser,
} from "../controllers/user.controller";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UserUpdateValidator } from "../validators/user/update-user.validator";
import { ResetPasswordValidator } from "../validators/user/reset-password.validator";
import upload from "../middlewares/UploadImageMiddleware";

const userRouter = express.Router();

/**
 * @openapi
 * /user/:
 *   get:
 *     summary: Gets a user by id
 *     description: Gets a user by id.
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSchema'
 */
userRouter.get("/", AuthMiddleware, getUserById);

/**
 * @openapi
 * /user/reset-password:
 *   patch:
 *     summary: Resets a logged-in user's password
 *     description: Resets a logged-in user's password and sends a new access token and refresh token, and increments the tokenVersion to logout from the other devices.
 *     tags:
 *       - User
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequestSchema'
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
userRouter.patch(
  "/reset-password",
  AuthMiddleware,
  ResetPasswordValidator,
  resetPassword,
);

/**
 * @openapi
 * /user/update:
 *   patch:
 *     summary: Updates a logged-in user
 *     description: Updates a logged-in user.
 *     tags:
 *       - User
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequestSchema'
 *     responses:
 *       200:
 *         description: User updated successfully.
 */
userRouter.patch(
  "/update",
  AuthMiddleware,
  upload.single("avatar"),
  UserUpdateValidator,
  updateUser,
);

export default userRouter;
