import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import CategoryModel from "../../models/Category.model";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import { Types } from "mongoose";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.categories.delete;

const deleteCategorySchema = z
  .object({
    categoryId: z
      .string(TRANSLATION_KEY_PREFIX.invalidId)
      .refine((val) => Types.ObjectId.isValid(val), {
        message: TRANSLATION_KEY_PREFIX.invalidId,
      }),
  })
  .loose();

export const DeleteCategoryValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = deleteCategorySchema.parse(req.body);
    req.body = body;

    const { categoryId } = req.body;

    const category = await CategoryModel.findOne({
      _id: categoryId,
      userId: scopeId,
      isDeleted: { $ne: true },
    });

    if (!category) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
