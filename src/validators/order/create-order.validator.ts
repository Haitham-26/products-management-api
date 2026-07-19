import z from "zod";
import { RequestHandler } from "express";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { RequestContext } from "../../utils/RequestContext";
import { parsePhoneNumber } from "awesome-phonenumber";
import { ProductStatus } from "../../types/product/types/ProductStatus.enum";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.orders.create;

const createOrderSchema = z
  .object({
    customerName: z
      .string(TRANSLATION_KEY_PREFIX.customerName.invalid)
      .trim()
      .min(1, TRANSLATION_KEY_PREFIX.customerName.short)
      .max(30, TRANSLATION_KEY_PREFIX.customerName.long),
    customerPhone: z
      .string(TRANSLATION_KEY_PREFIX.customerPhone.invalid)
      .trim()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          return parsePhoneNumber(val).valid;
        },
        { message: TRANSLATION_KEY_PREFIX.customerPhone.invalid },
      )
      .optional()
      .or(z.literal("")),
    customerEmail: z
      .email(TRANSLATION_KEY_PREFIX.customerEmail.invalid)
      .optional()
      .or(z.literal("")),
    customerAddress: z
      .string(TRANSLATION_KEY_PREFIX.customerAddress.invalid)
      .max(256, TRANSLATION_KEY_PREFIX.customerAddress.long)
      .optional()
      .or(z.literal("")),
    items: z
      .array(
        z.object({
          productId: z
            .string(TRANSLATION_KEY_PREFIX.items.invalidProductId)
            .refine((val) => Types.ObjectId.isValid(val), {
              message: TRANSLATION_KEY_PREFIX.items.invalidProductId,
            }),
          quantity: z
            .int(TRANSLATION_KEY_PREFIX.items.quantity.invalid)
            .min(1, TRANSLATION_KEY_PREFIX.items.quantity.min),
        }),
      )
      .min(1, TRANSLATION_KEY_PREFIX.items.minLength),
    note: z
      .string(TRANSLATION_KEY_PREFIX.note.invalid)
      .trim()
      .max(256, TRANSLATION_KEY_PREFIX.note.long)
      .optional(),
  })
  .loose();

export const CreateOrderValidator: RequestHandler = async (req, res, next) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = createOrderSchema.parse(req.body);
    req.body = body;

    const productIds = [
      ...new Set(body.items.map((item) => new Types.ObjectId(item.productId))),
    ];

    const products = await ProductModel.find({
      _id: { $in: productIds },
      isDeleted: { $ne: true },
      status: { $ne: ProductStatus.DRAFT },
      userId: scopeId,
    });

    if (products.length !== productIds.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.items.someNotFound,
      });
    }

    let insufficientStockProductNames: string[] = [];

    for (const product of products) {
      if (
        ((product.quantity as number) || 0) <
          (body.items.find((item) => item.productId === product._id.toString())
            ?.quantity as number) ||
        0
      ) {
        insufficientStockProductNames.push(product.name as string);
      }
    }

    if (insufficientStockProductNames.length) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.items.insufficientStock,
        params: {
          productNames: insufficientStockProductNames.join(", "),
        },
      });
    }

    RequestContext(req, { products });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
