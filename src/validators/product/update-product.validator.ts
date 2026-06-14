import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { Types } from "mongoose";
import CategoryModel from "../../models/Category.model";
import TagModel from "../../models/Tag.model";
import { RequestContext } from "../../utils/RequestContext";
import { ProductDiscountTypes } from "../../types/product/types/ProductDiscountTypes.enum";
import { ProductStatus } from "../../types/product/types/ProductStatus.enum";

const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name must be at least 1 character")
      .max(100, "Name must be at most 100 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(512, "Description must be at most 512 characters")
      .optional(),
    status: z.enum(Object.values(ProductStatus)).optional(),
    price: z.number().min(0, "Price must be at least 0").optional(),
    quantity: z.number().min(0, "Quantity must be at least 0").optional(),
    discount: z
      .object({
        type: z.enum(Object.values(ProductDiscountTypes)),
        value: z.number().min(0, "Value must be at least 0"),
      })
      .optional(),
    categoryId: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .loose();

export const UpdateProductValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { id } = req.params;

    const product = await ProductModel.findOne({ _id: id, userId });

    if (!product) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Product not found" });
      return;
    }

    const body = updateProductSchema.parse(req.body);
    req.body = body;

    if (req.body?.categoryId) {
      if (Types.ObjectId.isValid(body.categoryId as string)) {
        const category = await CategoryModel.findOne({
          _id: req.body.categoryId,
          userId,
        });

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

      const tags = await TagModel.find({ _id: { $in: tagIds }, userId }).select(
        "_id",
      );

      if (tags.length !== tagIds.length) {
        res.status(StatusCode.NOT_FOUND).send({ message: "Tag not found" });
        return;
      }

      req.body.tags = tagIds.map((id: string) => new Types.ObjectId(id));
    }

    RequestContext(req, { product });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
