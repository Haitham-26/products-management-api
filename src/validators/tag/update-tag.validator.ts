import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import TagModel from "../../models/Tag.model";
import { RequestContext } from "../../utils/RequestContext";

const updateTagSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name must be at least 1 character")
      .max(100, "Name must be at most 100 characters"),
    description: z
      .string()
      .trim()
      .max(512, "Description must be at most 512 characters")
      .optional(),
  })
  .loose();

export const UpdateTagValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { id } = req.params;

    const tag = await TagModel.findById({ _id: id, userId });

    if (!tag) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Tag not found" });
      return;
    }

    const body = updateTagSchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
