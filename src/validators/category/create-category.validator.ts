import z from "zod";
import express from "express";
import { errorHandler } from "../../errors/errorHandler";

const createCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name must be at least 1 character")
      .max(100, "Name must be at most 100 characters"),
    description: z
      .string()
      .trim()
      .max(512, "Description must be at most 512 characters")
      .optional(),
  })
  .loose();

export const CreateCategoryValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const body = createCategorySchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
