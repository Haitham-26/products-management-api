import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";
import { Types } from "mongoose";
import TagModel from "../../models/Tag.model";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.tags.delete;

const deleteTagSchema = z
  .object({
    tagId: z
      .string(TRANSLATION_KEY_PREFIX.invalidId)
      .refine((val) => Types.ObjectId.isValid(val), {
        message: TRANSLATION_KEY_PREFIX.invalidId,
      }),
  })
  .loose();

export const DeleteTagValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = deleteTagSchema.parse(req.body);
    req.body = body;

    const { tagId } = req.body;

    const tag = await TagModel.findOne({
      _id: tagId,
      userId: scopeId,
      isDeleted: { $ne: true },
    });

    if (!tag) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    RequestContext(req, { tag });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
