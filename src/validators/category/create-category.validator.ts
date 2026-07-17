import z from "zod";
import { RequestHandler } from "express";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.categories.create;

const createCategorySchema = z
  .object({
    name: z
      .string(TRANSLATION_KEY_PREFIX.name.invalid)
      .trim()
      .min(1, TRANSLATION_KEY_PREFIX.name.short)
      .max(64, TRANSLATION_KEY_PREFIX.name.long),
    description: z
      .string(TRANSLATION_KEY_PREFIX.description.invalid)
      .trim()
      .max(512, TRANSLATION_KEY_PREFIX.description.long)
      .optional(),
  })
  .loose();

export const CreateCategoryValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = createCategorySchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
