import z from "zod";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import OrderModel from "../../models/Order.model";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import ReturnModel from "../../models/Return.model";
import { CreateReturnDto } from "../../types/return/dto/CreateReturnDto";
import ProductModel from "../../models/Product.model";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.returns.create;

const createReturnSchema = z.object({
  orderId: z
    .string(TRANSLATION_KEY_PREFIX.order.invalidId)
    .refine((val) => Types.ObjectId.isValid(val), {
      message: TRANSLATION_KEY_PREFIX.order.invalidId,
    }),
  items: z
    .array(
      z.object({
        productId: z
          .string(TRANSLATION_KEY_PREFIX.items.invalidProductId)
          .refine((val) => Types.ObjectId.isValid(val), {
            message: TRANSLATION_KEY_PREFIX.items.invalidProductId,
          }),
        returnedQuantity: z
          .int(TRANSLATION_KEY_PREFIX.items.returnedQuantity.invalid)
          .min(1, TRANSLATION_KEY_PREFIX.items.returnedQuantity.min),
        restockedQuantity: z
          .int(TRANSLATION_KEY_PREFIX.items.restockedQuantity.invalid)
          .min(0, TRANSLATION_KEY_PREFIX.items.restockedQuantity.min),
      }),
    )
    .min(1, TRANSLATION_KEY_PREFIX.items.minLength)
    .refine(
      (items) => new Set(items.map((i) => i.productId)).size === items.length,
      { message: TRANSLATION_KEY_PREFIX.items.duplicateItems },
    ),
  returnReason: z
    .string(TRANSLATION_KEY_PREFIX.returnReason.invalid)
    .trim()
    .min(1, TRANSLATION_KEY_PREFIX.returnReason.required)
    .max(256, TRANSLATION_KEY_PREFIX.returnReason.long),
});
export const CreateReturnValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = createReturnSchema.parse(req.body);
    req.body = body;

    const { orderId, items } = req.body as CreateReturnDto;

    const order = await OrderModel.findOne({
      _id: orderId,
      userId: scopeId,
      status: OrderStatus.DELIVERED,
    });

    if (!order) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.order.notFound,
      });
    }

    const orderItemIds = order.items.map((item) => item.productId.toString());

    // check if some items don't belong to the order
    if (items.some((item) => !orderItemIds.includes(item.productId))) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.items.someNotFound,
      });
    }

    const alreadyHasReturn = await ReturnModel.findOne({
      userId: scopeId,
      orderId,
    });

    if (alreadyHasReturn) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.alreadyHasReturn,
      });
    }

    const someProductsMissing = await ProductModel.find({
      _id: { $in: items.map((item) => item.productId) },
      userId: scopeId,
    });

    if (someProductsMissing.length !== items.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.items.someNotFound,
      });
    }

    const someItemsExceedQuantity = items.some((item) => {
      const orderItem = order.items.find((orderItem) =>
        orderItem.productId.equals(item.productId),
      );

      if (!orderItem) {
        return false;
      }

      return item.returnedQuantity > orderItem.quantity;
    });

    if (someItemsExceedQuantity) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.items.someExceededQuantity,
      });
    }

    const someItemsExceedRestockedQuantity = items.some((item) => {
      const orderItem = order.items.find((orderItem) =>
        orderItem.productId.equals(item.productId),
      );

      if (!orderItem) {
        return false;
      }

      return item.restockedQuantity > item.returnedQuantity;
    });

    if (someItemsExceedRestockedQuantity) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.items.someExceededRestockedQuantity,
      });
    }

    RequestContext(req, { order });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
