import z from "zod";
import { RequestHandler } from "express";
import ProductModel from "../../models/Product.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.products.manageStock;

const manageProductStockSchema = z
  .object({
    productId: z.string(TRANSLATION_KEY_PREFIX.invalidProductId),
    stockChange: z
      .int(TRANSLATION_KEY_PREFIX.stockChange.invalid)
      .refine((val) => val !== 0, {
        message: TRANSLATION_KEY_PREFIX.stockChange.zero,
      }),
  })
  .loose();

export const ManageProductStockValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = manageProductStockSchema.parse(req.body);
    req.body = body;

    const { productId } = req.body;

    const product = await ProductModel.findOne({
      _id: productId,
      userId: scopeId,
      isDeleted: { $ne: true },
    });

    if (!product) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    const currentQuantity = product.quantity as number;

    if (currentQuantity + body.stockChange < 0) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.belowZero,
        params: { currentQuantity: String(currentQuantity) },
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
