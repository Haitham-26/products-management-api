import jwt from "jsonwebtoken";

export const generateJWT = (userId: string, tokenVersion: number) => {
  const jwtToken = jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return jwtToken;
};
