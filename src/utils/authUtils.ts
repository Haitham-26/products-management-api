import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.model";
import { RefreshTokenModel } from "../models/Refresh-token.model";
import { Response } from "express";
import { errorHandler } from "../errors/errorHandler";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";

export const generateAccessToken = (userId: string, tokenVersion: number) => {
  const jwtToken = jwt.sign(
    { userId, tokenVersion, type: "access" },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "5m",
    },
  );

  return jwtToken;
};

export const generateRefreshToken = (userId: string, tokenVersion: number) => {
  const jwtToken = jwt.sign(
    { userId, tokenVersion, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "30d",
    },
  );

  return jwtToken;
};

export const createAuthSession = async (
  res: Response,
  user: User,
  sendUser: boolean = true,
) => {
  try {
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

    const refreshToken = generateRefreshToken(
      user._id.toString(),
      user.tokenVersion,
    );

    await RefreshTokenModel.create({
      userId: user._id,
      hashedToken: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + MONTH_MS),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MONTH_MS,
      path: "/",
    });

    const { forgotPasswordCode, optCode, tokenVersion, password, ...safeUser } =
      user;

    res.status(StatusCode.OK).json({
      ...(sendUser ? { user: safeUser } : {}),
      accessToken: generateAccessToken(user._id.toString(), user.tokenVersion),
    });
  } catch (e) {
    errorHandler(e, res);
  }
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
