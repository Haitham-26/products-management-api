import { RequestHandler } from "express";
import { StatusCode } from "../../../types/shared/dto/StatusCode.enum";
import UserModel from "../../../models/User.model";
import jwt from "jsonwebtoken";
import isNil from "lodash/isNil";
import { RequestContext } from "../../../utils/RequestContext";

export const RefreshTokenValidator: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Refresh token is required",
      });
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as {
      userId: string;
      tokenVersion?: number;
      type?: string;
    };

    if (decoded.type !== "refresh" || isNil(decoded.tokenVersion)) {
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

    RequestContext(req, { user });

    next();
  } catch (e) {
    console.log(e);
    res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
  }
};
