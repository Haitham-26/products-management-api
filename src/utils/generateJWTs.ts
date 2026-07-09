import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string, tokenVersion: number) => {
  const jwtToken = jwt.sign(
    { userId, tokenVersion, type: "access" },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
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
