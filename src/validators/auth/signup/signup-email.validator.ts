import z from "zod";
import { Regexes } from "../../../utils/String";
import { RequestHandler } from "express";
import { errorHandler } from "../../../errors/errorHandler";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { ApiError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.signup.email;

const signUpEmailSchema = z
  .object({
    name: z
      .string(TRANSLATION_KEY_PREFIX.name.invalid)
      .trim()
      .min(3, TRANSLATION_KEY_PREFIX.name.short)
      .max(30, TRANSLATION_KEY_PREFIX.name.long)
      .regex(Regexes.NAME, TRANSLATION_KEY_PREFIX.name.regex),
    company: z
      .string(TRANSLATION_KEY_PREFIX.company.invalid)
      .trim()
      .max(50, TRANSLATION_KEY_PREFIX.company.long)
      .optional()
      .or(z.literal("")),
    email: z.email(TRANSLATION_KEY_PREFIX.email.invalid),
    password: z
      .string(TRANSLATION_KEY_PREFIX.password.invalid)
      .trim()
      .min(8, TRANSLATION_KEY_PREFIX.password.short)
      .max(64, TRANSLATION_KEY_PREFIX.password.long)
      .regex(Regexes.PASSWORD, TRANSLATION_KEY_PREFIX.password.regex),
  })
  .loose();

export const SignUpEmailValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = signUpEmailSchema.parse(req.body);
    req.body = body;

    const isEmailExist = await UserModel.findOne({ email: req.body.email });

    if (isEmailExist) {
      if (isEmailExist.emailVerified === false) {
        throw new ApiError({
          message: TRANSLATION_KEY_PREFIX.notVerifiedExists,
          status: StatusCode.BAD_REQUEST,
        });
      }

      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.userExists,
        status: StatusCode.BAD_REQUEST,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
