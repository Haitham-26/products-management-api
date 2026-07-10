import z from "zod";
import { Regexes } from "../../utils/String";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { RequestHandler } from "express";

const userUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters long")
      .max(30, "Name must be at most 30 characters long")
      .regex(Regexes.NAME, "Name contains invalid characters"),
    company: z
      .string()
      .trim()
      .max(50, "Company name must be at most 50 characters long")
      .optional()
      .or(z.literal("")),
    avatar: z.string().optional().or(z.literal("")),
  })
  .partial();

export const UserUpdateValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = userUpdateSchema.parse(req.body);
    req.body = body;

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
