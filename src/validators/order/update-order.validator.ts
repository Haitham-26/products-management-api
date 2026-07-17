import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import { parsePhoneNumber } from "awesome-phonenumber";
import has from "lodash/has";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.orders.update;

const updateOrderSchema = z
  .object({
    customerName: z
      .string(APIErrorKeys.orders.create.customerName.invalid)
      .trim()
      .min(1, APIErrorKeys.orders.create.customerName.short)
      .max(30, APIErrorKeys.orders.create.customerName.long)
      .optional(),
    customerPhone: z
      .string(APIErrorKeys.orders.create.customerPhone.invalid)
      .trim()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          return parsePhoneNumber(val).valid;
        },
        { message: APIErrorKeys.orders.create.customerPhone.invalid },
      )
      .optional()
      .or(z.literal("")),
    customerEmail: z
      .email(APIErrorKeys.orders.create.customerEmail.invalid)
      .optional()
      .or(z.literal("")),
    customerAddress: z
      .string(APIErrorKeys.orders.create.customerAddress.invalid)
      .max(256, APIErrorKeys.orders.create.customerAddress.long)
      .optional()
      .or(z.literal("")),
    note: z
      .string(APIErrorKeys.orders.create.note.invalid)
      .trim()
      .max(256, APIErrorKeys.orders.create.note.long)
      .optional(),
    isArchived: z.boolean(TRANSLATION_KEY_PREFIX.invalidIsArchived).optional(),
  })
  .loose();

export const UpdateOrderValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { orderId } = req.body;

    const body = updateOrderSchema.parse(req.body);
    req.body = body;

    const order = await OrderModel.findOne({
      _id: orderId,
      userId: scopeId,
    });

    if (!order) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    // To make sure archived orders fields cannot be updated except for isArchived
    if (
      order.isArchived &&
      Object.keys(req.body).filter(
        (key) => !["orderId", "isArchived", "userId"].includes(key),
      ).length
    ) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.cannotUpdateArchived,
      });
    }

    if (order.status !== OrderStatus.PENDING && !has(req.body, "isArchived")) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.cannotUpdateNonPending,
      });
    }

    RequestContext(req, { order });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
