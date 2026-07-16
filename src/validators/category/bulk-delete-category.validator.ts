import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import CategoryModel from "../../models/Category.model";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import { Types } from "mongoose";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.categories.bulkDelete;

const bulkDeleteCategorySchema = z
  .object({
    categoryIds: z
      .array(
        z
          .string(TRANSLATION_KEY_PREFIX.invalidId)
          .refine((val) => Types.ObjectId.isValid(val), {
            message: TRANSLATION_KEY_PREFIX.invalidId,
          }),
      )
      .min(1, TRANSLATION_KEY_PREFIX.minLength),
  })
  .loose();

export const BulkDeleteCategoryValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkDeleteCategorySchema.parse(req.body);
    req.body = body;

    const { categoryIds } = req.body;

    const categories = await CategoryModel.find({
      _id: { $in: categoryIds },
      userId: scopeId,
      isDeleted: { $ne: true },
    });

    if (categories.length !== categoryIds.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: APIErrorKeys.categories.bulkDelete.notFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
