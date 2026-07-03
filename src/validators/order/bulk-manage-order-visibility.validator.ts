import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import { OrderVisibility } from "../../types/order/types/OrderVisibility.enum";

const bulkManageOrderVisibilitySchema = z
  .object({
    orderIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: "Some order IDs are invalid",
        }),
      )
      .min(1, "At least one order id is required"),
    visibility: z.enum(Object.values(OrderVisibility)),
  })
  .loose();

export const BulkManageOrderVisibilityValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { orderIds } = req.body;

    const body = bulkManageOrderVisibilitySchema.parse(req.body);
    req.body = body;

    const orders = await OrderModel.find({
      _id: { $in: orderIds },
      userId,
    });

    if (orderIds.length !== orders.length) {
      res
        .status(StatusCode.NOT_FOUND)
        .send({ message: "Some orders not found" });
      return;
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
