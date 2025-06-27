import express from "express";
import { login, signUp } from "../controllers/user.controller";

const userRouter = express.Router();

userRouter.post("/register", signUp);

userRouter.post("/login", login);

export default userRouter;
