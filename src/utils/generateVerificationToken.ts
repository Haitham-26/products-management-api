import crypto from "crypto";

export const generateVerificationToken = () => {
  const allowedChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const bytes = crypto.randomBytes(6);

  let token = "";

  for (let i = 0; i < bytes.length; i++) {
    token += allowedChars[bytes[i] % allowedChars.length];
  }

  return token;
};
