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
import { isUndefined } from "lodash";
import TagModel from "../models/Tag.model";

class ProductService {
  constructor() {}

  static calculatePriceAfterDiscount(
    price: number,
    discount?: Product["discount"],
  ) {
    if (!discount) {
      return price;
    }

    if (discount.type === "percentage") {
      return price * (1 - discount.value / 100);
    }

    return price - discount.value;
  }
}

const createProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { name, description, price, quantity, discount, categoryId, tags } =
      req.body;

    await withTransaction(async (session) => {
      await ProductModel.create(
        [
          {
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
      minPrice,
      maxPrice,
      minQuantity,
      maxQuantity,
      discountType,
      meta,
    } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: any = { userId: new Types.ObjectId(userId as string) };

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
      query.$or = [
        { name: { $regex: keyword || "", $options: "i" } },
        { description: { $regex: keyword || "", $options: "i" } },
      ];
    }

    if (!isNil(minPrice) || !isNil(maxPrice)) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
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

    if (discountType) {
      query["discount.type"] = discountType;
    }

    const [total, products] = await Promise.all([
      ProductModel.countDocuments(query),
      ProductModel.find(query)
        .populate("category", "name")
        .populate("tags", "name")
        .sort({ createdAt: -1 })
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
    const { id } = req.params;

    await withTransaction(async (session) => {
      const product = await ProductModel.findByIdAndDelete(id, {
        session,
      }).populate("tags", "_id");

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
    const { id } = req.params;

    const { name, description, price, quantity, discount, categoryId, tags } =
      req.body;

    const { product } = RequestContext<{ product: Product }>(req);

    const updateDto: Partial<Product> = {};

    if (isString(name)) {
      updateDto.name = name;
    }
    if (isString(description)) {
      updateDto.description = description;
    }

    if (!isNaN(price)) {
      updateDto.price = Number(price);
    }
    if (!isNaN(quantity)) {
      updateDto.quantity = Number(quantity);
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

    if (categoryId) {
      updateDto.categoryId = new Types.ObjectId(categoryId as string);
    }

    if (Array.isArray(tags)) {
      const tagsIds = tags.map((tag) => new Types.ObjectId(tag as string));
      updateDto.tags = tagsIds;
    }

    await withTransaction(async (session) => {
      const oldCategoryId = product?.categoryId || null;
      const newCategoryId = !isUndefined(categoryId)
        ? categoryId
          ? new Types.ObjectId(categoryId as string)
          : null
        : oldCategoryId;

      const oldTags = product?.tags?.map((tag) => tag._id) || [];
      const newTags = !isUndefined(tags)
        ? tags.map((tag: string) => new Types.ObjectId(tag as string))
        : [];

      const removedTags = oldTags.filter((tag) => !newTags.includes(tag));
      const addedTags = newTags.filter(
        (tag: Types.ObjectId) => !oldTags.includes(tag),
      );

      await ProductModel.findByIdAndUpdate(
        id,
        { $set: updateDto },
        { session },
      );

      if (oldCategoryId === newCategoryId) {
        return;
      }

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
  }
};

export { createProduct, getProducts, deleteProduct, updateProduct };
