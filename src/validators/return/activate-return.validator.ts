import z from "zod";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import ReturnModel from "../../models/Return.model";
import { ReturnStatus } from "../../types/return/types/ReturnStatus.enum";
import OrderModel from "../../models/Order.model";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.returns.activate;

const activateReturnSchema = z.object({
  returnId: z
    .string(TRANSLATION_KEY_PREFIX.return.invalidId)
    .refine((val) => Types.ObjectId.isValid(val), {
      message: TRANSLATION_KEY_PREFIX.return.invalidId,
    }),
});

export const ActivateReturnValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = activateReturnSchema.parse(req.body);
    req.body = body;

    const { returnId } = req.body;

    const _return = await ReturnModel.findOne({
      _id: returnId,
      userId: scopeId,
    });

    if (!_return) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.return.notFound,
      });
    }

    if (_return.status === ReturnStatus.ACTIVE) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.return.alreadyActive,
      });
    }

    const order = await OrderModel.findOne({
      _id: _return.orderId,
      userId: scopeId,
      status: OrderStatus.DELIVERED,
    });

    if (!order) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.parentOrderNotFound,
      });
    }

    RequestContext(req, { _return, order });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
