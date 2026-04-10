import z from "zod";
import { Regexes } from "../../../utils/Regexs";
import express from "express";
import { ThrowZodError } from "../../../utils/ThrowZodError";

const signUpEmailSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "The name must be at least 3 characters long")
    .max(30, "The name must be at most 30 characters long")
    .regex(Regexes.NAME, "The name contains invalid characters"),
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .trim()
    .min(6, "The password must be at least 6 characters long")
    .max(64, "The password must be at most 64 characters long")
    .regex(Regexes.PASSWORD, "The password contains invalid characters"),
});

export const SignUpEmailValidator = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  try {
    const body = signUpEmailSchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
