import z from "zod";
import express from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import { parsePhoneNumber } from "awesome-phonenumber";
import has from "lodash/has";
import { errorHandler } from "../../errors/errorHandler";

const updateOrderSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(1, "Customer name is required")
      .max(30, "Customer name must be at most 30 characters")
      .optional(),
    customerPhone: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          return parsePhoneNumber(val).valid;
        },
        { message: "Invalid phone number" },
      )
      .optional()
      .or(z.literal("")),
    customerEmail: z
      .email("Please enter a valid email address")
      .optional()
      .or(z.literal("")),
    note: z
      .string()
      .trim()
      .max(256, "Note must be at most 256 characters")
      .optional(),
    isArchived: z.boolean().optional(),
  })
  .loose();

export const UpdateOrderValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { orderId } = req.body;

    const order = await OrderModel.findOne({
      _id: orderId,
      userId: scopeId,
    });

    if (!order) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Order not found" });
      return;
    }

    // To make sure archived orders fields cannot be updated except for isArchived
    if (
      order.isArchived &&
      Object.keys(req.body).filter(
        (key) => !["orderId", "isArchived", "userId"].includes(key),
      ).length
    ) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Archived order cannot be updated." });
      return;
    }

    if (order.status !== OrderStatus.PENDING && !has(req.body, "isArchived")) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Only pending orders can be updated." });
      return;
    }

    const body = updateOrderSchema.parse(req.body);
    req.body = body;

    RequestContext(req, { order });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
