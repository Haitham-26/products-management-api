import z from "zod";
import express, { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import TagModel from "../../models/Tag.model";
import { RequestContext } from "../../utils/RequestContext";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const updateTagSchema = z
  .object({
    name: z
      .string(APIErrorKeys.tags.create.name.invalid)
      .trim()
      .min(1, APIErrorKeys.tags.create.name.short)
      .max(32, APIErrorKeys.tags.create.name.long),
    description: z
      .string()
      .trim()
      .max(512, APIErrorKeys.tags.create.description.long)
      .optional(),
  })
  .loose();

export const UpdateTagValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = updateTagSchema.parse(req.body);
    req.body = body;

    const { tagId } = req.body;

    const tag = await TagModel.findOne({ _id: tagId, userId: scopeId });

    if (!tag) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: APIErrorKeys.tags.update.notFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
