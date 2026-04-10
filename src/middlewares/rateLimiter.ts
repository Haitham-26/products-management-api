import rateLimit from "express-rate-limit";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "تقوم بالكثير من الإجراءات بسرعة كبيرة جداً، يرجى المحاولة لاحقاً بعد 15 دقيقة",
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
      "لقد وصلت للحد الأقصى من الرسائل، انتظر 30 دقيقة قبل المحاولة مرة أخرى",
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
      "أنت ترد على الأسئلة بسرعة كبيرة، انتظر 10 دقائق قبل المحاولة مرة أخرى!",
  },
  statusCode: StatusCode.TOO_MANY_REQUESTS,
});
