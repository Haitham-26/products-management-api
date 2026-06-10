import z from "zod";
import express from "express";
import { ThrowZodError } from "../../../utils/ThrowZodError";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import UserModel from "../../../models/User.model";
import { RequestContext } from "../../../utils/RequestContext";

const forgotPasswordEmailSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
  })
  .loose();

export const ForgotPasswordEmailValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const body = forgotPasswordEmailSchema.parse(req.body);
    req.body = body;

    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      res.status(StatusCode.NOT_FOUND).send({
        message: "A user with this email does not exist",
      });
      return;
    }

    if (user.signUpMethod !== SignUpMethods.EMAIL) {
      res.status(StatusCode.BAD_REQUEST).send({
        message:
          "This account was created with google, please sign in with google",
      });
      return;
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
