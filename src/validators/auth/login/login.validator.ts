import z from "zod";
import { Regexes } from "../../../utils/String";
import { RequestHandler } from "express";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { errorHandler } from "../../../errors/errorHandler";
import { APIError } from "../../../errors/APIError";
import { RequestContext } from "../../../utils/RequestContext";
import bcrypt from "bcrypt";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.login;

const loginSchema = z.object({
  email: z.email(TRANSLATION_KEY_PREFIX.email.invalid),
  password: z.string(TRANSLATION_KEY_PREFIX.password.invalid),
});

export const LoginValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    req.body = body;

    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select(
      "-forgotPasswordCode",
    );

    if (user && user.signUpMethod !== SignUpMethods.EMAIL) {
      throw new APIError({
        message: TRANSLATION_KEY_PREFIX.differentMethod,
        status: StatusCode.BAD_REQUEST,
      });
    }

    if (!user || !user.emailVerified) {
      throw new APIError({
        message: TRANSLATION_KEY_PREFIX.notFound,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password as string,
    );

    if (!isPasswordCorrect) {
      throw new APIError({
        message: TRANSLATION_KEY_PREFIX.password.incorrect,
        status: StatusCode.BAD_REQUEST,
      });
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
