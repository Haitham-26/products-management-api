import z from "zod";
import { RequestHandler } from "express";
import { errorHandler } from "../../../errors/errorHandler";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import UserModel from "../../../models/User.model";
import { RequestContext } from "../../../utils/RequestContext";
import { APIError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.signup.token;

const signUpTokenSchema = z.object({
  token: z
    .string(TRANSLATION_KEY_PREFIX.token.invalid)
    .min(6, TRANSLATION_KEY_PREFIX.token.length)
    .max(6, TRANSLATION_KEY_PREFIX.token.length),
  email: z.email(TRANSLATION_KEY_PREFIX.email.invalid),
});

export const SignUpTokenValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = signUpTokenSchema.parse(req.body);
    req.body = body;

    const { email, token } = req.body;

    const user = await UserModel.findOne({
      email,
      emailVerified: false,
    });

    if (!user) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    if (!user.optCode?.code || !user.optCode?.createdAt) {
      throw new APIError({
        status: StatusCode.INTERNAL_ERROR,
        message: APIErrorKeys.internal,
      });
    }

    if (user.optCode.code !== token) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.token.incorrect,
      });
    }

    // Token expires in 5 minutes
    const signUpTokenExpiryMs = 5 * 60 * 1000;

    if (Date.now() - user.optCode.createdAt.getTime() >= signUpTokenExpiryMs) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.token.expired,
      });
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
