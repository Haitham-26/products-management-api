import z from "zod";
import { Regexes } from "../../../utils/String";
import { RequestHandler } from "express";
import UserModel from "../../../models/User.model";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { errorHandler } from "../../../errors/errorHandler";
import { ApiError } from "../../../errors/APIError";

const loginSchema = z.object({
  email: z.email("serverErrors.login.email.invalid"),
  password: z
    .string("serverErrors.login.password.invalid")
    .min(8, "serverErrors.login.password.short")
    .max(64, "serverErrors.login.password.long")
    .regex(Regexes.PASSWORD, "serverErrors.login.password.regex"),
});

export const LoginValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    req.body = body;

    const user = await UserModel.findOne({ email: req.body.email });

    if (user && user.signUpMethod !== SignUpMethods.EMAIL) {
      throw new ApiError({
        message: "serverErrors.login.differentMethod",
        status: StatusCode.BAD_REQUEST,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
