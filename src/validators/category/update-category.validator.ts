import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import CategoryModel from "../../models/Category.model";
import { RequestContext } from "../../utils/RequestContext";
import { Types } from "mongoose";

const updateCategorySchema = z
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

export const UpdateCategoryValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { categoryId } = req.body;

    const category = await CategoryModel.findOne({
      _id: new Types.ObjectId(categoryId as string),
      userId,
    });

    if (!category) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Category not found" });
      return;
    }

    const body = updateCategorySchema.parse(req.body);
    req.body = body;
    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
