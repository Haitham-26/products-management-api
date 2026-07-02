import rateLimit from "express-rate-limit";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "You have reached the maximum number of requests, please try again later.",
  },
  statusCode: StatusCode.TOO_MANY_REQUESTS,
});

export const sendMessageLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "You have reached the maximum number of requests, please try again later.",
  },
  statusCode: StatusCode.TOO_MANY_REQUESTS,
});

export const replyOnQuestionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "You have reached the maximum number of requests, please try again later.",
  },
  statusCode: StatusCode.TOO_MANY_REQUESTS,
});
