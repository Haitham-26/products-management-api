import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import ProductModel from "../../models/Product.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";

const manageProductStockSchema = z
  .object({
    stockChange: z
      .number()
      .int()
      .refine((val) => val !== 0, {
        message: "Stock change cannot be zero",
      }),
  })
  .loose();

export const ManageProductStockValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const body = manageProductStockSchema.parse(req.body);
    req.body = body;

    const product = await ProductModel.findById(id);

    if (!product) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Product not found" });
      return;
    }

    const currentQuantity = product.quantity as number;

    if (currentQuantity + body.stockChange < 0) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: `Cannot decrease stock below 0. Available stock: ${currentQuantity}`,
      });
      return;
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
