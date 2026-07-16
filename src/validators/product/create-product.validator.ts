import z from "zod";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import CategoryModel from "../../models/Category.model";
import TagModel from "../../models/Tag.model";
import { ProductDiscountTypes } from "../../types/product/types/ProductDiscountTypes.enum";
import { RequestContext } from "../../utils/RequestContext";
import { normalizeMultipartBody } from "../../utils/normalizeMultipartBody";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.products.create;

const createProductSchema = z
  .object({
    name: z
      .string(TRANSLATION_KEY_PREFIX.name.invalid)
      .trim()
      .min(1, TRANSLATION_KEY_PREFIX.name.short)
      .max(64, TRANSLATION_KEY_PREFIX.name.long),
    description: z
      .string(TRANSLATION_KEY_PREFIX.description.invalid)
      .trim()
      .max(512, TRANSLATION_KEY_PREFIX.description.long)
      .optional(),
    price: z
      .number(TRANSLATION_KEY_PREFIX.price.invalid)
      .min(0, TRANSLATION_KEY_PREFIX.price.min),
    quantity: z
      .number(TRANSLATION_KEY_PREFIX.quantity.invalid)
      .min(0, TRANSLATION_KEY_PREFIX.quantity.min),
    discount: z
      .object({
        type: z.enum(
          Object.values(ProductDiscountTypes),
          TRANSLATION_KEY_PREFIX.discount.type.invalid,
        ),
        value: z
          .number(TRANSLATION_KEY_PREFIX.discount.value.invalid)
          .min(0, TRANSLATION_KEY_PREFIX.discount.value.min),
      })
      .optional(),
    categoryId: z
      .string()
      .refine((v) => Types.ObjectId.isValid(v), {
        message: TRANSLATION_KEY_PREFIX.invalidCategoryId,
      })
      .optional()
      .or(z.literal("")),
    tags: z.array(z.string(TRANSLATION_KEY_PREFIX.invalidTagId)).optional(),
  })
  .loose();

export const CreateProductValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    req.body = normalizeMultipartBody(req.body);

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    ["discount", "tags"].forEach((key: string) => {
      if (req.body[key]) {
        req.body[key] = JSON.parse(req.body[key]);
      }

      if (key === "discount" && req.body?.dicsount?.value) {
        req.body.discount.value = Number(req.body.discount.value);
      }
    });

    ["price", "quantity", "minStock"].forEach((key: string) => {
      if (req.body[key]) {
        req.body[key] = Number(req.body[key]);
      }
    });

    const body = createProductSchema.parse(req.body);
    req.body = body;

    if (req.body?.categoryId) {
      const category = await CategoryModel.findOne({
        _id: req.body.categoryId,
        userId: scopeId,
      });

      if (!category) {
        throw new APIError({
          status: StatusCode.NOT_FOUND,
          message: TRANSLATION_KEY_PREFIX.category.notFound,
        });
      }
    }

    if (req.body?.tags) {
      const tagIds = [...new Set(req.body.tags)] as string[];

      const tags = await TagModel.find({
        _id: { $in: tagIds },
        userId: scopeId,
      }).select("_id");

      if (tags.length !== tagIds.length) {
        throw new APIError({
          status: StatusCode.NOT_FOUND,
          message: TRANSLATION_KEY_PREFIX.tags.someNotFound,
        });
      }
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
