import z from "zod";
import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import ProductModel from "../../models/Product.model";
import { RequestContext } from "../../utils/RequestContext";
import { parsePhoneNumber } from "awesome-phonenumber";
import { ProductStatus } from "../../types/product/types/ProductStatus.enum";

const createOrderSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(1, "Customer name is required")
      .max(30, "Customer name must be at most 30 characters"),
    customerPhone: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          return parsePhoneNumber(val).valid;
        },
        { message: "Invalid phone number" },
      )
      .optional()
      .or(z.literal("")),
    customerEmail: z
      .email("Please enter a valid email")
      .optional()
      .or(z.literal("")),
    items: z
      .array(
        z.object({
          productId: z.string().refine((val) => Types.ObjectId.isValid(val), {
            message: "Invalid productId",
          }),
          quantity: z.number().min(1, "Quantity must be at least 1"),
        }),
      )
      .min(1, "Order must have at least one product"),
    note: z
      .string()
      .trim()
      .max(256, "Note must be at most 256 characters")
      .optional(),
  })
  .loose();

export const CreateOrderValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = createOrderSchema.parse(req.body);
    req.body = body;

    if (!body.items.length) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Order must have at least one product" });
      return;
    }

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
      res.status(StatusCode.NOT_FOUND).send({
        message:
          "Some products not found, they may have been deleted or moved to draft",
      });
      return;
    }

    for (const product of products) {
      if (
        ((product.quantity as number) || 0) <
          (body.items.find((item) => item.productId === product._id.toString())
            ?.quantity as number) ||
        0
      ) {
        res.status(StatusCode.BAD_REQUEST).send({
          message: `Product ${product.name} has insufficient quantity`,
        });
        return;
      }
    }

    RequestContext(req, { products });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
