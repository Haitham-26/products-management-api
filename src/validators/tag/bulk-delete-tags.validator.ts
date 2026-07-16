import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import { Types } from "mongoose";
import TagModel from "../../models/Tag.model";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.tags.bulkDelete;

const bulkDeleteTagsSchema = z
  .object({
    tagIds: z
      .array(
        z
          .string(TRANSLATION_KEY_PREFIX.invalidId)
          .refine((val) => Types.ObjectId.isValid(val), {
            message: TRANSLATION_KEY_PREFIX.invalidId,
          }),
      )
      .min(1, TRANSLATION_KEY_PREFIX.minLength),
  })
  .loose();

export const BulkDeleteTagsValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = bulkDeleteTagsSchema.parse(req.body);
    req.body = body;

    const { tagIds } = req.body;

    const tags = await TagModel.find({
      _id: { $in: tagIds },
      userId: scopeId,
      isDeleted: { $ne: true },
    });

    if (tags.length !== tagIds.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
