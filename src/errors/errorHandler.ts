// errorHandler.ts
import { APIError } from "./APIError";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import express from "express";
import { ZodError } from "zod";
import { APIErrorKeys } from "./APIError-keys";

export const errorHandler = (e: unknown, res: express.Response) => {
  console.log(e);

  if (e instanceof APIError) {
    res.status(e.status).json({
      message: e.message,
      params: e.params,
    });
    return;
  }

  if (e instanceof ZodError) {
    const firstError = e.issues[0];
    const params: Record<string, string> = {};

    if (firstError.code === "too_small") {
      params.min = String(firstError.minimum);
    }

    if (firstError.code === "too_big") {
      params.max = String(firstError.maximum);
    }

    res.status(StatusCode.BAD_REQUEST).json({
      message: firstError.message,
      params,
    });
    return;
  }

  res.status(StatusCode.INTERNAL_ERROR).json({
    message: APIErrorKeys.internal,
  });
  return;
};
