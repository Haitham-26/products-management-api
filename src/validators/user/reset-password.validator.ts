import z from "zod";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { Regexes } from "../../utils/String";
import { RequestContext } from "../../utils/RequestContext";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { User } from "../../models/User.model";
import { SignUpMethods } from "../../types/auth/shared/SignUpMethods";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { ApiError } from "../../errors/APIError";

const resetPasswordNewSchema = z
  .object({
    currentPassword: z
      .string(APIErrorKeys.signup.email.password.invalid)
      .trim()
      .min(8, APIErrorKeys.signup.email.password.short)
      .max(64, APIErrorKeys.signup.email.password.long)
      .regex(Regexes.PASSWORD, APIErrorKeys.signup.email.password.regex),
    newPassword: z
      .string(APIErrorKeys.signup.email.password.invalid)
      .trim()
      .min(8, APIErrorKeys.signup.email.password.short)
      .max(64, APIErrorKeys.signup.email.password.long)
      .regex(Regexes.PASSWORD, APIErrorKeys.signup.email.password.regex),
  })
  .loose();

export const ResetPasswordValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    if (user.signUpMethod !== SignUpMethods.EMAIL) {
      throw new ApiError({
        message: APIErrorKeys.user.changePassword.differentMethod,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const body = resetPasswordNewSchema.parse(req.body);
    req.body = body;

    const isCorrectCurrentPassword = await bcrypt.compare(
      req.body.currentPassword,
      user.password as string,
    );

    if (!isCorrectCurrentPassword) {
      throw new ApiError({
        message: APIErrorKeys.user.changePassword.currentPassword.incorrect,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const isCurrentPassword = await bcrypt.compare(
      req.body.newPassword,
      user.password as string,
    );

    if (isCurrentPassword) {
      throw new ApiError({
        message: APIErrorKeys.user.changePassword.samePassword,
        status: StatusCode.BAD_REQUEST,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
