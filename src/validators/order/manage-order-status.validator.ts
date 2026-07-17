import { RequestHandler } from "express";
import { Types } from "mongoose";
import z from "zod";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel, { Order } from "../../models/Order.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import {
  buildInsufficientStockDetail,
  checkOrderProductsStockAvailability,
} from "../../utils/orderProductsStockValidation";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.orders.manageStatus;

const manageOrderStatusSchema = z
  .object({
    orderId: z
      .string(TRANSLATION_KEY_PREFIX.invalidOrderId)
      .refine((val) => Types.ObjectId.isValid(val), {
        message: TRANSLATION_KEY_PREFIX.invalidOrderId,
      }),
    status: z.enum(
      Object.keys(OrderStatus),
      TRANSLATION_KEY_PREFIX.invalidStatus,
    ),
  })
  .loose();

export const ManageOrderStatusValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = manageOrderStatusSchema.parse(req.body);
    req.body = body;

    const order = await OrderModel.findOne({
      _id: body.orderId,
      userId: scopeId,
    });

    if (!order) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.cannotChangeDelivered,
      });
    }

    if (order.status.toLowerCase() === body.status.toLowerCase()) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.sameStatus,
      });
    }

    if (
      order.status === OrderStatus.CANCELED &&
      body.status === OrderStatus.DELIVERED
    ) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.canceledToDelivered,
      });
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
      const { orderIdentifier, productNames } =
        buildInsufficientStockDetail(
          insufficientStockProductIds,
          productMap,
          orderIdentifiersByProductId,
        ) || {};

      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.items.insufficientStock,
        ...(orderIdentifier && productNames
          ? {
              params: { orderIdentifier, productNames },
            }
          : {}),
      });
    }

    RequestContext(req, { order });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
