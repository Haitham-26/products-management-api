import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { Types } from "mongoose";
import { RequestContext } from "../../utils/RequestContext";
import { ProductStatus } from "../../types/product/types/ProductStatus.enum";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.products.bulkManageStatus;

const bulkManageProductStatusSchema = z
  .object({
    status: z.enum(
      Object.values(ProductStatus),
      TRANSLATION_KEY_PREFIX.invalidStatus,
    ),
    productIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: TRANSLATION_KEY_PREFIX.productIds.invalid,
        }),
      )
      .min(1, TRANSLATION_KEY_PREFIX.productIds.minLength),
  })
  .loose();

export const BulkManageProductStatusValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkManageProductStatusSchema.parse(req.body);
    req.body = body;

    const products = await ProductModel.find({
      _id: { $in: req.body.productIds },
      userId: scopeId,
    });

    if (products.length !== req.body.productIds.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.productIds.someNotFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
