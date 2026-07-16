import z from "zod";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import { OrderVisibility } from "../../types/order/types/OrderVisibility.enum";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.orders.bulkManageVisibility;

const bulkManageOrderVisibilitySchema = z
  .object({
    orderIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: TRANSLATION_KEY_PREFIX.orderIds.invalid,
        }),
      )
      .min(1, TRANSLATION_KEY_PREFIX.orderIds.minLength),
    visibility: z.enum(
      Object.values(OrderVisibility),
      TRANSLATION_KEY_PREFIX.visibility.invalid,
    ),
  })
  .loose();

export const BulkManageOrderVisibilityValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { orderIds } = req.body;

    const body = bulkManageOrderVisibilitySchema.parse(req.body);
    req.body = body;

    const orders = await OrderModel.find({
      _id: { $in: orderIds },
      userId: scopeId,
    });

    if (orderIds.length !== orders.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.someNotFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
