import z from "zod";
import express from "express";
import { ThrowZodError } from "../../../utils/ThrowZodError";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../../utils/RequestContext";

const signUpResendTokenSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export const SignUpTokenResendValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const body = signUpResendTokenSchema.parse(req.body);
    req.body = body;

    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      res.status(StatusCode.NOT_FOUND).send({
        message: "A user with this email does not exist",
      });
      return;
    }

    if (user.emailVerified) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "This email is already verified, please sign in instead.",
      });
      return;
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
