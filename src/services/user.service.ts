import express from "express";
import { getUserById, updateUser } from "../controllers/user.controller";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UserUpdateValidator } from "../validators/user/update-user.validator";

const userRouter = express.Router();

userRouter.post("/", AuthMiddleware, getUserById);
userRouter.patch("/update", AuthMiddleware, UserUpdateValidator, updateUser);

export default userRouter;
