import rateLimit from "express-rate-limit";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { APIErrorKeys } from "../errors/APIError-keys";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: APIErrorKeys.rateLimit.global,
  },
  statusCode: StatusCode.TOO_MANY_REQUESTS,
});
