import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";

export const multerErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        res.status(StatusCode.BAD_REQUEST).json({
          message: "File is too large. Maximum allowed size is 5MB.",
        });
        return;

      case "LIMIT_UNEXPECTED_FILE":
        res.status(StatusCode.BAD_REQUEST).json({
          message: "Unexpected file field.",
        });
        return;

      case "LIMIT_FILE_COUNT":
        res.status(StatusCode.BAD_REQUEST).json({
          message: "Too many files uploaded.",
        });
        return;

      default:
        res.status(StatusCode.BAD_REQUEST).json({
          message: err.message,
        });
        return;
    }
  }

  if (err) {
    res.status(StatusCode.BAD_REQUEST).json({
      message: err?.message || "Upload file error",
    });
    return;
  }

  next();
};
