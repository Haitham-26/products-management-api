import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import UserModel from "../models/User.model";
import isNil from "lodash/isNil";

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
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
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
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
    }

    const user = await UserModel.findOne({
      _id: decoded.userId,
      tokenVersion: decoded.tokenVersion,
    });

    if (!user) {
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
    }

    RequestContext(req, { userId: user._id, user });

    next();
  } catch (e) {
    console.error("JWT Verification Error:", e);
    res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
    return;
  }
};
