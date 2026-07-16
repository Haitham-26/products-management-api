import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import UserModel from "../../../models/User.model";
import { RequestContext } from "../../../utils/RequestContext";
import { errorHandler } from "../../../errors/errorHandler";
import { ApiError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.forgotPassword.email;

const forgotPasswordEmailSchema = z
  .object({
    email: z.email(TRANSLATION_KEY_PREFIX.email.invalid),
  })
  .loose();

export const ForgotPasswordEmailValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = forgotPasswordEmailSchema.parse(req.body);
    req.body = body;

    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.notFound,
        status: StatusCode.BAD_REQUEST,
      });
    }

    if (!user.emailVerified) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.notVerified,
        status: StatusCode.BAD_REQUEST,
      });
    }

    if (user.signUpMethod !== SignUpMethods.EMAIL) {
      throw new ApiError({
        message: TRANSLATION_KEY_PREFIX.differentMethod,
        status: StatusCode.BAD_REQUEST,
      });
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
