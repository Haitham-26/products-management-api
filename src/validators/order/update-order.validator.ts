import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";

const updateOrderSchema = z
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
      .optional(),
    note: z
      .string()
      .trim()
      .max(256, "Note must be at most 256 characters")
      .optional(),
  })
  .loose();

export const UpdateOrderValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const order = await OrderModel.findOne({
      _id: req.params.id,
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Order not found" });
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Only pending orders can be updated" });
      return;
    }

    const body = updateOrderSchema.parse(req.body);
    req.body = body;

    if (body?.items?.length) {
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
    }

    RequestContext(req, { order });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
