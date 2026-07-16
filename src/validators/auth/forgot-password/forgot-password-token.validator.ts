import { RequestHandler } from "express";
import z from "zod";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { errorHandler } from "../../../errors/errorHandler";
import { ApiError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.forgotPassword.token;

const forgotPasswordTokenSchema = z
  .object({
    token: z
      .string(TRANSLATION_KEY_PREFIX.token.invalid)
      .trim()
      .min(6, TRANSLATION_KEY_PREFIX.token.length)
      .max(6, TRANSLATION_KEY_PREFIX.token.length),
  })
  .loose();

export const ForgotPasswordTokenValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = forgotPasswordTokenSchema.parse(req.body);
    req.body = body;

    const user = await UserModel.findOne({ email: req.body.email });

    if (
      !user?.forgotPasswordCode ||
      !user.forgotPasswordCode?.code ||
      !user.forgotPasswordCode?.createdAt
    ) {
      throw new ApiError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.token.missing,
      });
    }

    if (
      new Date(user.forgotPasswordCode.createdAt).getTime() + 5 * 60 * 1000 <
      Date.now()
    ) {
      throw new ApiError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.token.expired,
      });
    }

    if (user.forgotPasswordCode.code !== req.body.token) {
      throw new ApiError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.token.incorrect,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
