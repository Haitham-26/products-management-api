import z from "zod";
import express from "express";
import { Regexes } from "../../../utils/String";
import { RequestContext } from "../../../utils/RequestContext";
import { User } from "../../../models/User.model";
import bcrypt from "bcrypt";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { errorHandler } from "../../../errors/errorHandler";

const forgotPasswordNewSchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(8, "The password must be at least 8 characters long")
      .max(64, "The password must be at most 64 characters long")
      .regex(Regexes.PASSWORD, "The password contains invalid characters"),
  })
  .loose();

export const ForgotPasswordNewValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const body = forgotPasswordNewSchema.parse(req.body);
    req.body = body;

    const isCurrentPassword = await bcrypt.compare(
      req.body.newPassword,
      user.password as string,
    );

    if (isCurrentPassword) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "The new password must be different from the current password",
      });
      return;
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
