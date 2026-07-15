import { RequestHandler } from "express";
import z from "zod";
import { errorHandler } from "../../../errors/errorHandler";
import { OAuth2Client } from "google-auth-library";
import { ApiError } from "../../../errors/APIError";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import UserModel from "../../../models/User.model";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { RequestContext } from "../../../utils/RequestContext";

const googleLoginSchema = z.object({
  idToken: z.string("serverErrors.internal"),
});

export const GoogleLoginValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = googleLoginSchema.parse(req.body);
    req.body = body;

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    const ticket = await client.verifyIdToken({
      idToken: req.body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new ApiError({
        message: "serverErrors.internal",
        status: StatusCode.BAD_REQUEST,
      });
    }

    const { email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Your google account is not verified" });
      return;
    }

    let user = await UserModel.findOne({ email }).select(
      "-password -optCode -forgotPasswordCode",
    );

    if (user && user?.signUpMethod !== SignUpMethods.GOOGLE) {
      throw new ApiError({
        message: "serverErrors.google-login.differentMethod",
        status: StatusCode.BAD_REQUEST,
      });
    }

    RequestContext(req, { user, name, picture, email });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
