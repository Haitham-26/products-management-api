import z from "zod";
import { Regexes } from "../../utils/String";
import { RequestHandler } from "express";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.user.update;

const userUpdateSchema = z
  .object({
    name: z
      .string(APIErrorKeys.signup.email.name.invalid)
      .trim()
      .min(3, APIErrorKeys.signup.email.name.short)
      .max(30, APIErrorKeys.signup.email.name.long)
      .regex(Regexes.NAME, APIErrorKeys.signup.email.name.regex),
    company: z
      .string()
      .trim()
      .max(50, APIErrorKeys.signup.email.company.long)
      .optional()
      .or(z.literal("")),
    avatar: z
      .string(TRANSLATION_KEY_PREFIX.avatar.invalid)
      .optional()
      .or(z.literal("")),
  })
  .partial();

export const UserUpdateValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = userUpdateSchema.parse(req.body);
    req.body = body;

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
