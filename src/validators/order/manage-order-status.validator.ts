import express from "express";
import { Types } from "mongoose";
import z from "zod";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";

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
    const { userId } = RequestContext<{ userId: string }>(req);

    const body = manageOrderStatusSchema.parse(req.body);
    req.body = body;

    const order = await OrderModel.findOne({
      _id: new Types.ObjectId(body.orderId),
      userId: new Types.ObjectId(userId),
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
      order.status === OrderStatus.CANCELLED &&
      body.status === OrderStatus.CONFIRMED
    ) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Cancelled order's status cannot be changed to confirmed. ",
      });
      return;
    }

    RequestContext(req, { order });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
