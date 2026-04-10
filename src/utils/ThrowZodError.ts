import z from "zod";
import express from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";

export const ThrowZodError = (res: express.Response, e: any) => {
  if (e instanceof z.ZodError) {
    const firstError = e.issues[0];
    res.status(StatusCode.BAD_REQUEST).json({
      field: firstError.path.join("."),
      message: firstError.message,
    });
    return;
  }

  console.log(e);
  res.status(StatusCode.INTERNAL_ERROR).json({
    message: "حدث خطاء غير متوقع",
  });
};
