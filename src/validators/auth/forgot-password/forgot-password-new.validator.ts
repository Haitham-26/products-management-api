import z from "zod";
import { Regexes } from "../../../utils/String";
import { RequestContext } from "../../../utils/RequestContext";
import { User } from "../../../models/User.model";
import bcrypt from "bcrypt";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { errorHandler } from "../../../errors/errorHandler";
import { RequestHandler } from "express-serve-static-core";
import { APIError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.forgotPassword.new;

const forgotPasswordNewSchema = z
  .object({
    newPassword: z
      .string(TRANSLATION_KEY_PREFIX.newPassword.invalid)
      .trim()
      .min(8, TRANSLATION_KEY_PREFIX.newPassword.short)
      .max(64, TRANSLATION_KEY_PREFIX.newPassword.long)
      .regex(Regexes.PASSWORD, TRANSLATION_KEY_PREFIX.newPassword.regex),
  })
  .loose();

export const ForgotPasswordNewValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const body = forgotPasswordNewSchema.parse(req.body);
    req.body = body;

    const isCurrentPassword = await bcrypt.compare(
      req.body.newPassword,
      user.password as string,
    );

    if (isCurrentPassword) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.samePassword,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
