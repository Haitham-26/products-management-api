import z from "zod";
import express from "express";
import bcrypt from "bcrypt";
import { Regexes } from "../../utils/String";
import { RequestContext } from "../../utils/RequestContext";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { User } from "../../models/User.model";

const resetPasswordNewSchema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(6, "The password must be at least 6 characters long")
      .max(64, "The password must be at most 64 characters long")
      .regex(Regexes.PASSWORD, "The password contains invalid characters"),
    newPassword: z
      .string()
      .trim()
      .min(6, "The password must be at least 6 characters long")
      .max(64, "The password must be at most 64 characters long")
      .regex(Regexes.PASSWORD, "The password contains invalid characters"),
  })
  .loose();

export const ResetPasswordValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const body = resetPasswordNewSchema.parse(req.body);
    req.body = body;

    const isCorrectCurrentPassword = await bcrypt.compare(
      req.body.currentPassword,
      user.password as string,
    );

    if (!isCorrectCurrentPassword) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Incorrect current password",
      });
      return;
    }

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
    ThrowZodError(res, e);
  }
};
