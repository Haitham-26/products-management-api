import z from "zod";
import { Regexes } from "../../../utils/String";
import { RequestHandler } from "express";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { errorHandler } from "../../../errors/errorHandler";
import { ApiError } from "../../../errors/APIError";
import { RequestContext } from "../../../utils/RequestContext";
import bcrypt from "bcrypt";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.login;

const loginSchema = z.object({
  email: z.email(TRANSLATION_KEY_PREFIX.email.invalid),
  password: z
    .string(TRANSLATION_KEY_PREFIX.password.invalid)
    .min(8, TRANSLATION_KEY_PREFIX.password.short)
    .max(64, TRANSLATION_KEY_PREFIX.password.long)
    .regex(Regexes.PASSWORD, TRANSLATION_KEY_PREFIX.password.regex),
});

export const LoginValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    req.body = body;

    const { email, password } = req.body;

    const user = (
      await UserModel.findOne({ email }).select("-forgotPasswordCode")
    )?.toObject();

    if (user && user.signUpMethod !== SignUpMethods.EMAIL) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.differentMethod,
        status: StatusCode.BAD_REQUEST,
      });
    }

    if (!user) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.notFound,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password as string,
    );

    if (!isPasswordCorrect) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.password.incorrect,
        status: StatusCode.BAD_REQUEST,
      });
    }

    if (!user.emailVerified) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.notVerified,
        status: StatusCode.BAD_REQUEST,
      });
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
