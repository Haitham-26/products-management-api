import { RequestHandler } from "express";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import UserModel from "../../../models/User.model";
import jwt from "jsonwebtoken";
import isNil from "lodash/isNil";
import { RequestContext } from "../../../utils/RequestContext";
import z from "zod";
import { errorHandler } from "../../../errors/errorHandler";
import { ApiError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";

const refreshTokenSchema = z.object({
  refreshToken: z.string(APIErrorKeys.refreshToken.token.invalid),
});

export const RefreshTokenValidator: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const body = refreshTokenSchema.parse(req.body);
    req.body = body;

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as {
      userId: string;
      tokenVersion?: number;
      type?: string;
    };

    if (decoded.type !== "refresh" || isNil(decoded.tokenVersion)) {
      throw new ApiError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    const user = await UserModel.findOne({
      _id: decoded.userId,
      tokenVersion: decoded.tokenVersion,
    });

    if (!user) {
      throw new ApiError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    RequestContext(req, { user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
