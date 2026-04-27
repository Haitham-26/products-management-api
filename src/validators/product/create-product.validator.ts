import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import CategoryModel from "../../models/Category.model";
import TagModel from "../../models/Tag.model";
import { ProductDiscountTypes } from "../../types/product/types/ProductDiscountTypes.enum";

const createProductSchema = z
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
    price: z.number().min(0, "Price must be at least 0"),
    quantity: z.number().min(0, "Quantity must be at least 0"),
    discount: z
      .object({
        type: z.enum(Object.values(ProductDiscountTypes)),
        value: z.number().min(0, "Value must be at least 0"),
      })
      .optional(),
    categoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .loose();

export const CreateProductValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const body = createProductSchema.parse(req.body);
    req.body = body;

    if (req.body?.categoryId) {
      if (Types.ObjectId.isValid(body.categoryId as string)) {
        const category = await CategoryModel.findById(req.body.categoryId);

        if (!category) {
          res
            .status(StatusCode.NOT_FOUND)
            .send({ message: "Category not found" });
          return;
        }

        req.body.categoryId = new Types.ObjectId(req.body.categoryId as string);
      } else {
        res
          .status(StatusCode.BAD_REQUEST)
          .send({ message: "Category ID is not valid" });
        return;
      }
    }

    if (req.body?.tags) {
      const tagIds = [...new Set(req.body.tags)] as string[];
      const invalidTagId = tagIds.find(
        (id: string) => !Types.ObjectId.isValid(id),
      );

      if (invalidTagId) {
        res
          .status(StatusCode.BAD_REQUEST)
          .send({ message: "Tag ID is not valid" });
        return;
      }

      const tags = await TagModel.find({ _id: { $in: tagIds } }).select("_id");

      if (tags.length !== tagIds.length) {
        res.status(StatusCode.NOT_FOUND).send({ message: "Tag not found" });
        return;
      }

      req.body.tags = tagIds.map((id: string) => new Types.ObjectId(id));
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
