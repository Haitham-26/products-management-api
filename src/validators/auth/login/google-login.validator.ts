import { RequestHandler } from "express";
import z from "zod";
import { errorHandler } from "../../../errors/errorHandler";
import { OAuth2Client } from "google-auth-library";
import { APIError } from "../../../errors/APIError";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import UserModel from "../../../models/User.model";
import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { RequestContext } from "../../../utils/RequestContext";
import { APIErrorKeys } from "../../../errors/APIError-keys";
import { GoogleRedirectURLs } from "../../../types/auth/google-login/GoogleRedirectURLs.enum";

const googleLoginSchema = z.object({
  code: z.string(APIErrorKeys.internal),
  redirectUrl: z.enum(Object.values(GoogleRedirectURLs), APIErrorKeys.internal),
  lang: z.string().optional(),
});

export const GoogleLoginValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = googleLoginSchema.parse(req.body);
    req.body = body;

    const { code, redirectUrl } = req.body;

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `https://i-inventix.vercel.app${redirectUrl}`,
    );

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      throw new APIError({
        message: APIErrorKeys.internal,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new APIError({
        message: APIErrorKeys.internal,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const { email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      throw new APIError({
        message: APIErrorKeys["google-login"].notVerified,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const user = await UserModel.findOne({ email }).select(
      "-password -optCode -forgotPasswordCode",
    );

    if (user && user.signUpMethod !== SignUpMethods.GOOGLE) {
      throw new APIError({
        message: APIErrorKeys["google-login"].differentMethod,
        status: StatusCode.BAD_REQUEST,
      });
    }

    RequestContext(req, {
      user,
      name,
      picture,
      email,
    });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
