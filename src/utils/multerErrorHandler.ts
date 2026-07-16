import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { errorHandler } from "../errors/errorHandler";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";

export const multerErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        throw new APIError({
          status: StatusCode.BAD_REQUEST,
          message: APIErrorKeys.imageUpload.limit.size,
          params: {
            maxSizeMB: "5",
          },
        });

      case "LIMIT_UNEXPECTED_FILE":
        throw new APIError({
          status: StatusCode.BAD_REQUEST,
          message: APIErrorKeys.imageUpload.limit.field,
        });

      case "LIMIT_FILE_COUNT":
        throw new APIError({
          status: StatusCode.BAD_REQUEST,
          message: APIErrorKeys.imageUpload.limit.count,
          params: {
            maxCount: "5",
          },
        });

      default:
        throw new APIError({
          status: StatusCode.BAD_REQUEST,
          message: err.message,
        });
    }
  }

  if (err) {
    errorHandler(err, res);
  }

  next();
};
