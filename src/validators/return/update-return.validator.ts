import z from "zod";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import ReturnModel from "../../models/Return.model";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.returns.update;

const updateReturnSchema = z.object({
  returnId: z
    .string(TRANSLATION_KEY_PREFIX.return.invalidId)
    .refine((val) => Types.ObjectId.isValid(val), {
      message: TRANSLATION_KEY_PREFIX.return.invalidId,
    }),
  returnReason: z
    .string(TRANSLATION_KEY_PREFIX.returnReason.invalid)
    .trim()
    .min(1, TRANSLATION_KEY_PREFIX.returnReason.required)
    .max(256, TRANSLATION_KEY_PREFIX.returnReason.long)
    .optional(),
});

export const UpdateReturnValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = updateReturnSchema.parse(req.body);
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

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
