import z from "zod";
import { RequestHandler } from "express";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../../utils/RequestContext";
import { errorHandler } from "../../../errors/errorHandler";
import { ApiError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.signup.token;

const signUpResendTokenSchema = z
  .object({
    email: z.email(TRANSLATION_KEY_PREFIX.email.invalid),
  })
  .loose();

export const SignUpTokenResendValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = signUpResendTokenSchema.parse(req.body);
    req.body = body;

    const { email } = req.body;

    const user = await UserModel.findOne({ email, emailVerified: false });

    if (!user) {
      throw new ApiError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
