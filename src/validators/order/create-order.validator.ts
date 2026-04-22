import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { RequestContext } from "../../utils/RequestContext";

const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().refine((val) => Types.ObjectId.isValid(val), {
            message: "Invalid productId",
          }),
          quantity: z.number().min(1, "Quantity must be at least 1"),
        }),
      )
      .min(1, "Order must have at least one product"),
    note: z
      .string()
      .trim()
      .max(256, "Note must be at most 256 characters")
      .optional(),
  })
  .loose();

export const CreateOrderValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const body = createOrderSchema.parse(req.body);
    req.body = body;

    const productIds = [...new Set(body.items.map((item) => item.productId))];

    const products = await ProductModel.find({
      _id: { $in: productIds },
      userId,
    });

    if (products.length !== productIds.length) {
      res.status(StatusCode.NOT_FOUND).send({
        message: "Some products not found, they may have been deleted",
      });
      return;
    }

    RequestContext(req, { products });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
