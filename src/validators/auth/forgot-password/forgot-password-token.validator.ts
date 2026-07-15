import express from "express";
import z from "zod";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { errorHandler } from "../../../errors/errorHandler";

const forgotPasswordTokenSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(6, "The verification code must be 6 characters long")
      .max(6, "The verification code must be 6 characters long"),
  })
  .loose();

export const ForgotPasswordTokenValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const body = forgotPasswordTokenSchema.parse(req.body);
    req.body = body;

    const user = await UserModel.findOne({ email: req.body.email });

    if (!user?.emailVerified) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "This account is not verified.",
      });
      return;
    }

    if (
      !user?.forgotPasswordCode ||
      !user.forgotPasswordCode?.code ||
      !user.forgotPasswordCode?.createdAt
    ) {
      res.status(StatusCode.BAD_REQUEST).send({
        message:
          "Something went wrong, please restart the process from the beginning.",
      });
      return;
    }

    if (
      new Date(user.forgotPasswordCode.createdAt).getTime() + 5 * 60 * 1000 <
      Date.now()
    ) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "The verification code has expired, please request a new one.",
      });
      return;
    }

    if (user.forgotPasswordCode.code !== req.body.token) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Incorrect verification code.",
      });
      return;
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
