import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import UserModel from "../models/User.model";
import isNull from "lodash/isNull";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  userId?: string;
}

export const AuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      tokenVersion?: number;
    };

    if (isNull(decoded.tokenVersion)) {
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
    }

    const userId = new Types.ObjectId(decoded.userId);

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
      return;
    }

    RequestContext(req, { userId, user });

    next();
  } catch (e) {
    console.error("JWT Verification Error:", e);
    res.status(StatusCode.UNAUTHORIZED).send("فشلت المصادقة");
    return;
  }
};
