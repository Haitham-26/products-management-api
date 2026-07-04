import express from "express";
import { Types } from "mongoose";
import z from "zod";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel, { Order } from "../../models/Order.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import {
  buildInsufficientStockMessage,
  checkOrderProductsStockAvailability,
} from "../../utils/orderProductsStockValidation";

const bulkManageOrderStatusSchema = z
  .object({
    orderIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: "Invalid orderId",
        }),
      )
      .min(1, "At least one order id is required"),
    status: z.enum(Object.keys(OrderStatus)),
  })
  .loose();

export const BulkManageOrderStatusValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkManageOrderStatusSchema.parse(req.body);
    req.body = body;

    const orders = await OrderModel.find({
      _id: { $in: body.orderIds },
      userId: scopeId,
    });

    if (body.orderIds.length !== orders.length) {
      res
        .status(StatusCode.NOT_FOUND)
        .send({ message: "Some orders not found" });
      return;
    }

    const {
      insufficientStockProductIds,
      productMap,
      orderIdentifiersByProductId,
    } = await checkOrderProductsStockAvailability(
      orders as unknown as Order[],
      body.status as OrderStatus,
      scopeId,
    );

    if (insufficientStockProductIds.length) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: buildInsufficientStockMessage(
          insufficientStockProductIds,
          productMap,
          orderIdentifiersByProductId,
        ),
      });
      return;
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
