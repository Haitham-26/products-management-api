import z from "zod";
import { Regexes } from "../../../utils/String";
import express from "express";
import { ThrowZodError } from "../../../utils/ThrowZodError";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z
    .string()
    .min(6, "The password must be at least 6 characters long")
    .max(64, "The password must be at most 64 characters long")
    .regex(Regexes.PASSWORD, "The password contains invalid characters"),
});

export const LoginValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const user = await UserModel.findOne({ email: req.body.email });

  try {
    if (user && user.signUpMethod !== SignUpMethods.EMAIL) {
      res.status(StatusCode.BAD_REQUEST).send({
        message:
          "This account was created with google, please sign in with google",
      });
      return;
    }

    const body = loginSchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
