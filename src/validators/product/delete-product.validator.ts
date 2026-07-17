import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import { Types } from "mongoose";
import ProductModel from "../../models/Product.model";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.products.delete;

const deleteProductSchema = z
  .object({
    productId: z
      .string(TRANSLATION_KEY_PREFIX.invalidId)
      .refine((val) => Types.ObjectId.isValid(val), {
        message: TRANSLATION_KEY_PREFIX.invalidId,
      }),
  })
  .loose();

export const DeleteProductValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = deleteProductSchema.parse(req.body);
    req.body = body;

    const { productId } = req.body;

    const product = await ProductModel.findOne({
      _id: productId,
      userId: scopeId,
      isDeleted: { $ne: true },
    }).populate("tags", "_id");

    if (!product) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    RequestContext(req, { product });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
