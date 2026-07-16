import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import CategoryModel from "../../models/Category.model";
import { RequestContext } from "../../utils/RequestContext";
import { Types } from "mongoose";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { ApiError } from "../../errors/APIError";

const updateCategorySchema = z
  .object({
    name: z
      .string(APIErrorKeys.categories.create.name.invalid)
      .trim()
      .min(1, APIErrorKeys.categories.create.name.short)
      .max(64, APIErrorKeys.categories.create.name.long),
    description: z
      .string(APIErrorKeys.categories.create.description.invalid)
      .trim()
      .max(512, APIErrorKeys.categories.create.description.long)
      .optional(),
  })
  .loose();

export const UpdateCategoryValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { categoryId } = req.body;

    const body = updateCategorySchema.parse(req.body);
    req.body = body;

    const category = await CategoryModel.findOne({
      _id: new Types.ObjectId(categoryId as string),
      userId: scopeId,
    });

    if (!category) {
      throw new ApiError({
        status: StatusCode.NOT_FOUND,
        message: APIErrorKeys.categories.update.notFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
