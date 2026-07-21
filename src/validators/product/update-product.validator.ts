import z from "zod";
import { RequestHandler } from "express";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { Types } from "mongoose";
import CategoryModel from "../../models/Category.model";
import TagModel from "../../models/Tag.model";
import { RequestContext } from "../../utils/RequestContext";
import { ProductDiscountTypes } from "../../types/product/types/ProductDiscountTypes.enum";
import { ProductStatus } from "../../types/product/types/ProductStatus.enum";
import { normalizeMultipartBody } from "../../utils/normalizeMultipartBody";
import isArray from "lodash/isArray";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.products.update;

const updateProductSchema = z
  .object({
    name: z
      .string(APIErrorKeys.products.create.name.invalid)
      .trim()
      .min(1, APIErrorKeys.products.create.name.short)
      .max(64, APIErrorKeys.products.create.name.long)
      .optional(),
    description: z
      .string(APIErrorKeys.products.create.description.invalid)
      .trim()
      .max(512, APIErrorKeys.products.create.description.long)
      .optional(),
    status: z
      .enum(Object.values(ProductStatus), TRANSLATION_KEY_PREFIX.invalidStatus)
      .optional(),
    purchasePrice: z
      .number(APIErrorKeys.products.create.purchasePrice.invalid)
      .min(0, APIErrorKeys.products.create.purchasePrice.min)
      .optional(),
    salePrice: z
      .number(APIErrorKeys.products.create.salePrice.invalid)
      .min(0, APIErrorKeys.products.create.salePrice.min)
      .optional(),
    quantity: z
      .int(APIErrorKeys.products.create.quantity.invalid)
      .min(0, APIErrorKeys.products.create.quantity.min)
      .optional(),
    discount: z
      .object({
        type: z.enum(
          Object.values(ProductDiscountTypes),
          APIErrorKeys.products.create.discount.type.invalid,
        ),
        value: z
          .number(APIErrorKeys.products.create.discount.value.invalid)
          .min(0, APIErrorKeys.products.create.discount.value.min),
      })
      .optional(),
    categoryId: z
      .string(APIErrorKeys.products.create.invalidCategoryId)
      .refine((val) => Types.ObjectId.isValid(val), {
        message: APIErrorKeys.products.create.invalidCategoryId,
      })
      .nullable()
      .optional(),
    tags: z
      .array(
        z
          .string(APIErrorKeys.products.create.invalidTagId)
          .refine((val) => Types.ObjectId.isValid(val), {
            message: APIErrorKeys.products.create.invalidTagId,
          }),
      )
      .refine((tags) => new Set(tags).size === tags.length, {
        message: APIErrorKeys.products.create.duplicateTags,
      })
      .optional(),
    mainImage: z
      .string(TRANSLATION_KEY_PREFIX.invalidMainImage)
      .nullable()
      .optional(),
    galleryImages: z
      .array(z.string(TRANSLATION_KEY_PREFIX.invalidGalleryImage))
      .optional(),
  })
  .loose();

export const UpdateProductValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    req.body = normalizeMultipartBody(req.body);

    if (req.body?.galleryImages && !isArray(req.body.galleryImages)) {
      req.body.galleryImages = [req.body.galleryImages];
    }

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { productId } = req.body;

    ["discount", "tags"].forEach((key: string) => {
      if (req.body[key]) {
        req.body[key] = JSON.parse(req.body[key]);
      }

      if (key === "discount" && req.body?.dicsount?.value) {
        req.body.discount.value = Number(req.body.discount.value);
      }
    });

    ["purchasePrice", "salePrice", "quantity", "minStock"].forEach(
      (key: string) => {
        if (req.body[key]) {
          req.body[key] = Number(req.body[key]);
        }
      },
    );

    const body = updateProductSchema.parse(req.body);
    req.body = body;

    const product = await ProductModel.findOne({
      _id: productId,
      userId: scopeId,
      isDeleted: { $ne: true },
    });

    if (!product) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    if (req.body?.categoryId) {
      const category = await CategoryModel.findOne({
        _id: req.body.categoryId,
        userId: scopeId,
        isDeleted: { $ne: true },
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
        isDeleted: { $ne: true },
      }).select("_id");

      if (tags.length !== tagIds.length) {
        throw new APIError({
          status: StatusCode.NOT_FOUND,
          message: TRANSLATION_KEY_PREFIX.tags.notFound,
        });
      }
    }

    RequestContext(req, { product });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
