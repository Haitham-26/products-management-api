import z from "zod";
import express from "express";
import { ThrowZodError } from "../../../utils/ThrowZodError";

const signUpTokenSchema = z.object({
  token: z
    .string()
    .min(6, "The verification code must be 6 characters long")
    .max(6, "The verification code must be 6 characters long"),
  email: z.email("The email is not valid"),
});

export const SignUpTokenValidator = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  try {
    const body = signUpTokenSchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
