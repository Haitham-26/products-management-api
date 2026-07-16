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

const TRANSLATION_KEY_PREFIX = APIErrorKeys.orders.bulkManageStatus;

const bulkManageOrderStatusSchema = z
  .object({
    orderIds: z
      .array(
        z.string().refine((val) => Types.ObjectId.isValid(val), {
          message: TRANSLATION_KEY_PREFIX.orderIds.invalid,
        }),
      )
      .min(1, TRANSLATION_KEY_PREFIX.orderIds.minLength),
    status: z.enum(
      Object.keys(OrderStatus),
      TRANSLATION_KEY_PREFIX.invalidStatus,
    ),
  })
  .loose();

export const BulkManageOrderStatusValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkManageOrderStatusSchema.parse(req.body);
    req.body = body;

    const orders = await OrderModel.find({
      _id: { $in: body.orderIds },
      userId: scopeId,
    });

    if (body.orderIds.length !== orders.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.orderIds.someNotFound,
      });
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

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
