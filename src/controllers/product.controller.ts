import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import ProductModel, { Product } from "../models/Product.model";
import isString from "lodash/isString";
import isNaN from "lodash/isNaN";
import { Types } from "mongoose";
import isNil from "lodash/isNil";
import CategoryModel from "../models/Category.model";
import { withTransaction } from "../utils/withTransaction";
import isNumber from "lodash/isNumber";
import isUndefined from "lodash/isUndefined";
import TagModel from "../models/Tag.model";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";
import { generateIdentifier } from "./counter.controller";
import { ProductStockStatus } from "../types/product/types/ProductStockStatus.enum";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
import { escapeSpecialChars } from "../utils/String";
import { ProductStatus } from "../types/product/types/ProductStatus.enum";
import isNull from "lodash/isNull";

export class ProductService {
  constructor() {}

  static calculatePriceAfterDiscount(
    price: number,
    discount?: Product["discount"],
  ) {
    let value = price;

    if (!discount) {
      return value;
    }

    if (discount.type === ProductDiscountTypes.PERCENTAGE) {
      value = price * (1 - discount.value / 100);
    } else {
      value = price - discount.value;
    }

    return Number(value.toFixed(2));
  }
}

const createProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const {
      name,
      description,
      price,
      quantity,
      discount,
      categoryId,
      tags,
      minStock,
    } = req.body;

    await withTransaction(async (session) => {
      const identifier = await generateIdentifier(
        req,
        CounterKeys.PRODUCT,
        session,
      );

      await ProductModel.create(
        [
          {
            identifier,
            name,
            description,
            price,
            quantity,
            discount,
            priceAfterDiscount: ProductService.calculatePriceAfterDiscount(
              price,
              discount,
            ),
            userId,
            categoryId: categoryId
              ? new Types.ObjectId(categoryId as string)
              : undefined,
            tags: tags
              ?.filter((tagId: string) => Types.ObjectId.isValid(tagId))
              ?.map((tagId: string) => new Types.ObjectId(tagId)),
            minStock: isNumber(minStock) ? Number(minStock) : undefined,
          },
        ],
        { session },
      );

      if (categoryId) {
        await CategoryModel.updateOne(
          { _id: new Types.ObjectId(categoryId as string) },
          { $inc: { childrenCount: 1 } },
          { session },
        );
      }

      if (tags?.length) {
        await TagModel.updateMany(
          {
            _id: {
              $in: tags.map((tagId: string) => new Types.ObjectId(tagId)),
            },
          },
          { $inc: { usageCount: 1 } },
          { session },
        );
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
};

const getProducts = async (req: express.Request, res: express.Response) => {
  try {
    const {
      userId,
      categoryId,
      tagIds,
      keyword,
      showDraft,
      creationDate,
      minBasePrice,
      maxBasePrice,
      minFinalPrice,
      maxFinalPrice,
      minQuantity,
      maxQuantity,
      discountType,
      stockStatus,
      meta,
    } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: any = {
      userId: new Types.ObjectId(userId as string),
      isDeleted: { $ne: true },
    };

    if (showDraft !== "true") {
      query.status = { $ne: ProductStatus.DRAFT };
    }

    if (categoryId && Types.ObjectId.isValid(categoryId as string)) {
      query.categoryId = new Types.ObjectId(categoryId as string);
    }

    if (tagIds) {
      const raw = Array.isArray(tagIds) ? tagIds : [tagIds];
      const ids = (raw as string[])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (ids.length) {
        query.tags = { $in: ids };
      }
    }

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.$or = [
        { name: { $regex: escapedKeyword || "", $options: "i" } },
        { description: { $regex: escapedKeyword || "", $options: "i" } },
        { identifier: { $regex: escapedKeyword || "", $options: "i" } },
      ];
    }

    if (!isNil(minBasePrice) || !isNil(maxBasePrice)) {
      query.price = {};
      if (minBasePrice) {
        query.price.$gte = Number(minBasePrice);
      }
      if (maxBasePrice) {
        query.price.$lte = Number(maxBasePrice);
      }
    }

    if (!isNil(minFinalPrice) || !isNil(maxFinalPrice)) {
      query.priceAfterDiscount = {};
      if (minFinalPrice) {
        query.priceAfterDiscount.$gte = Number(minFinalPrice);
      }
      if (maxFinalPrice) {
        query.priceAfterDiscount.$lte = Number(maxFinalPrice);
      }
    }

    if (!isNil(minQuantity) || !isNil(maxQuantity)) {
      query.quantity = {};
      if (minQuantity) {
        query.quantity.$gte = Number(minQuantity);
      }
      if (maxQuantity) {
        query.quantity.$lte = Number(maxQuantity);
      }
    }

    if (stockStatus) {
      if (stockStatus === ProductStockStatus.OUT_OF_STOCK) {
        query.quantity = 0;
      } else if (stockStatus === ProductStockStatus.LOW_STOCK) {
        query.$expr = {
          $and: [
            { $gt: ["$quantity", 0] },
            {
              $lte: ["$quantity", { $ifNull: ["$minStock", 10] }],
            },
          ],
        };
      } else if (stockStatus === ProductStockStatus.IN_STOCK) {
        query.$expr = {
          $gt: ["$quantity", { $ifNull: ["$minStock", 10] }],
        };
      }
    }

    if (discountType) {
      query["discount.type"] = discountType;
    }

    const [total, products] = await Promise.all([
      ProductModel.countDocuments(query),
      ProductModel.find(query)
        .populate({
          path: "category",
          select: "name",
          match: { isDeleted: { $ne: true } },
        })
        .populate({
          path: "tags",
          select: "name",
          match: { isDeleted: { $ne: true } },
        })
        .sort({
          createdAt: getCreatedAtSort(creationDate as CreationDateFilters),
        })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.status(200).json({
      data: products,
      meta: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: currentPage < Math.ceil(total / pageSize),
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (e) {
    console.error("Get Products Error:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { id } = req.params;

    await withTransaction(async (session) => {
      const product = await ProductModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true, session },
      ).populate("tags", "_id");

      if (product?.categoryId) {
        await CategoryModel.updateOne(
          { _id: product.categoryId },
          { $inc: { childrenCount: -1 } },
          { session },
        );
      }

      if (product?.tags?.length) {
        await TagModel.updateMany(
          { _id: { $in: product.tags.map((tag) => tag._id) } },
          { $inc: { usageCount: -1 } },
          { session },
        );
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const updateProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { id } = req.params;

    const {
      name,
      description,
      price,
      quantity,
      discount,
      categoryId,
      tags,
      minStock,
      status,
    } = req.body;

    const { product } = RequestContext<{ product: Product }>(req);

    const updateDto: Partial<Product> = {};

    if (isString(name)) {
      updateDto.name = name;
    }
    if (isString(description)) {
      updateDto.description = description;
    }

    if (Object.values(ProductStatus).includes(status as ProductStatus)) {
      updateDto.status = status;
    }

    if (!isNaN(price) && isNull(price)) {
      updateDto.price = Number(price);
    }
    if (!isNaN(quantity) && isNull(quantity)) {
      updateDto.quantity = Number(quantity);
    }
    if (!isUndefined(minStock) && !isNaN(minStock)) {
      updateDto.minStock = Number(minStock);
    }

    if (discount) {
      updateDto.discount = discount;
    }

    if (!isUndefined(price) || !isUndefined(discount)) {
      const finalPrice = !isNaN(price) ? Number(price) : product.price;
      const finalDiscount = discount ?? product.discount;

      updateDto.priceAfterDiscount = ProductService.calculatePriceAfterDiscount(
        finalPrice,
        finalDiscount,
      );
    }

    if (!isUndefined(categoryId)) {
      if (categoryId) {
        updateDto.categoryId = new Types.ObjectId(categoryId as string);
      } else {
        updateDto.categoryId = null;
      }
    }

    if (Array.isArray(tags)) {
      updateDto.tags = tags.map((tag) => new Types.ObjectId(tag));
    }

    await withTransaction(async (session) => {
      const oldCategoryId = product?.categoryId || null;

      let newCategoryId: Types.ObjectId | null = null;

      if (!isUndefined(categoryId)) {
        if (categoryId) {
          newCategoryId = new Types.ObjectId(categoryId as string);
        } else {
          newCategoryId = null;
        }
      } else {
        newCategoryId = oldCategoryId;
      }

      const oldTags: Types.ObjectId[] =
        product?.tags?.map((tag) => tag._id) || [];

      let addedTags: Types.ObjectId[] = [];
      let removedTags: Types.ObjectId[] = [];

      if (Array.isArray(tags)) {
        const newTags = tags.map((tag: string) => new Types.ObjectId(tag));

        removedTags = oldTags.filter(
          (oldTag) => !newTags.some((newTag) => newTag.equals(oldTag)),
        );

        addedTags = newTags.filter(
          (newTag) => !oldTags.some((oldTag) => oldTag.equals(newTag)),
        );
      }

      await ProductModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateDto },
        { session },
      );

      if (
        !oldCategoryId?.equals(newCategoryId as any) &&
        !(!oldCategoryId && !newCategoryId)
      ) {
        if (oldCategoryId) {
          await CategoryModel.updateOne(
            { _id: oldCategoryId },
            { $inc: { childrenCount: -1 } },
            { session },
          );
        }

        if (newCategoryId) {
          await CategoryModel.updateOne(
            { _id: newCategoryId },
            { $inc: { childrenCount: 1 } },
            { session },
          );
        }
      }

      if (removedTags.length) {
        await TagModel.updateMany(
          { _id: { $in: removedTags } },
          { $inc: { usageCount: -1 } },
          { session },
        );
      }

      if (addedTags.length) {
        await TagModel.updateMany(
          { _id: { $in: addedTags } },
          { $inc: { usageCount: 1 } },
          { session },
        );
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
};

const manageProductStock = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { id } = req.params;

    const { stockChange } = req.body;

    await ProductModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $inc: { quantity: Number(stockChange) } },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export {
  createProduct,
  getProducts,
  deleteProduct,
  updateProduct,
  manageProductStock,
};
