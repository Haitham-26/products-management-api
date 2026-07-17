import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import UserModel from "../models/User.model";
import isNil from "lodash/isNil";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";
import { errorHandler } from "../errors/errorHandler";

interface AuthRequest extends Request {
  userId?: string;
}

export const AuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      throw new APIError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as {
      userId: string;
      tokenVersion?: number;
      type?: string;
    };

    if (decoded.type !== "access" || isNil(decoded.tokenVersion)) {
      throw new APIError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    const user = await UserModel.findOne({
      _id: decoded.userId,
      tokenVersion: decoded.tokenVersion,
      emailVerified: true,
    });

    if (!user) {
      throw new APIError({
        status: StatusCode.UNAUTHORIZED,
        message: APIErrorKeys.unauthorized,
      });
    }

    RequestContext(req, { userId: user._id, user });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
