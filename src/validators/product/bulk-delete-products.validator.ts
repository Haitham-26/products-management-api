import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import { Types } from "mongoose";
import ProductModel from "../../models/Product.model";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.products.bulkDelete;

const bulkDeleteProductsSchema = z
  .object({
    productIds: z
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

export const BulkDeleteProductsValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkDeleteProductsSchema.parse(req.body);
    req.body = body;

    const { productIds } = req.body;

    const products = await ProductModel.find({
      _id: { $in: productIds },
      userId: scopeId,
      isDeleted: { $ne: true },
    }).populate("tags", "_id");

    if (products.length !== productIds.length) {
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
