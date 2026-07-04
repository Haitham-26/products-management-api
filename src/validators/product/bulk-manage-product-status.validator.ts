import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { Types } from "mongoose";
import { RequestContext } from "../../utils/RequestContext";
import { ProductStatus } from "../../types/product/types/ProductStatus.enum";

const bulkManageProductStatusSchema = z
  .object({
    status: z.enum(Object.values(ProductStatus)),
    productIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: "Invalid product id",
        }),
      )
      .min(1, "At least one product id is required"),
  })
  .loose();

export const BulkManageProductStatusValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkManageProductStatusSchema.parse(req.body);
    req.body = body;

    const products = await ProductModel.find({
      _id: { $in: req.body.productIds },
      userId: scopeId,
    });

    if (products.length !== req.body.productIds.length) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Some product not found" });
      return;
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
