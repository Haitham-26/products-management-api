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

const manageOrderStatusSchema = z
  .object({
    orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid orderId",
    }),
    status: z.enum(Object.keys(OrderStatus)),
  })
  .loose();

export const ManageOrderStatusValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = manageOrderStatusSchema.parse(req.body);
    req.body = body;

    const order = await OrderModel.findOne({
      _id: body.orderId,
      userId: scopeId,
    });

    if (!order) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Order not found" });
      return;
    }

    if (order.status === OrderStatus.CONFIRMED) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Confirmed order's status cannot be changed" });
      return;
    }

    if (order.status.toLowerCase() === body.status.toLowerCase()) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "The order is already in this status" });
      return;
    }

    if (
      order.status === OrderStatus.CANCELED &&
      body.status === OrderStatus.CONFIRMED
    ) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Canceled order's status cannot be changed to confirmed. ",
      });
      return;
    }

    const {
      insufficientStockProductIds,
      productMap,
      orderIdentifiersByProductId,
    } = await checkOrderProductsStockAvailability(
      [order as unknown as Order],
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

    RequestContext(req, { order });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
