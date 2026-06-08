import z from "zod";
import express from "express";
import { ThrowZodError } from "../../../utils/ThrowZodError";
import { Regexes } from "../../../utils/String";

const forgotPasswordNewSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(6, "The password must be at least 6 characters long")
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
    const body = forgotPasswordNewSchema.parse(req.body);
    req.body = body;

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
