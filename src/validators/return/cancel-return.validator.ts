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

const TRANSLATION_KEY_PREFIX = APIErrorKeys.returns.cancel;

const cancelReturnSchema = z.object({
  returnId: z
    .string(TRANSLATION_KEY_PREFIX.return.invalidId)
    .refine((val) => Types.ObjectId.isValid(val), {
      message: TRANSLATION_KEY_PREFIX.return.invalidId,
    }),
});

export const CancelReturnValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = cancelReturnSchema.parse(req.body);
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

    if (_return.status === ReturnStatus.CANCELED) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.return.alreadyCanceled,
      });
    }

    RequestContext(req, { _return });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
