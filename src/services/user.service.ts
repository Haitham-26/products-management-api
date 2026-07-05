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

userRouter.post("/", AuthMiddleware, getUserById);
userRouter.patch(
  "/reset-password",
  AuthMiddleware,
  ResetPasswordValidator,
  resetPassword,
);
userRouter.patch(
  "/update",
  AuthMiddleware,
  UserUpdateValidator,
  upload.single("avatar"),
  updateUser,
);

export default userRouter;
