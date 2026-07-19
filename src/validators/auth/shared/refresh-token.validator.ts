import { RequestHandler } from "express";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import UserModel from "../../../models/User.model";
import jwt from "jsonwebtoken";
import isNil from "lodash/isNil";
import crypto from "crypto";
import { RequestContext } from "../../../utils/RequestContext";
import { errorHandler } from "../../../errors/errorHandler";
import { APIError } from "../../../errors/APIError";
import { APIErrorKeys } from "../../../errors/APIError-keys";
import { RefreshTokenModel } from "../../../models/Refresh-token.model";
import { hashToken } from "../../../utils/authUtils";

export const RefreshTokenValidator: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new APIError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    const hashedToken = hashToken(refreshToken);

    const storedToken = await RefreshTokenModel.findOne({
      hashedToken,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new APIError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as {
      userId: string;
      tokenVersion?: number;
      type?: string;
    };

    if (
      decoded.type !== "refresh" ||
      isNil(decoded.tokenVersion) ||
      storedToken.userId.toString() !== decoded.userId
    ) {
      throw new APIError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    const user = await UserModel.findOne({
      _id: decoded.userId,
      tokenVersion: decoded.tokenVersion,
    });

    if (!user) {
      throw new APIError({
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
