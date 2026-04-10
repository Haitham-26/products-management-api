import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import ProductModel, { Product } from "../models/Product.model";
import isString from "lodash/isString";
import isNaN from "lodash/isNaN";
import { Types } from "mongoose";
import isNil from "lodash/isNil";

const createProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { name, description, price, quantity, discount, categoryId, tags } =
      req.body;

    await ProductModel.create({
      name,
      description,
      price,
      quantity,
      discount,
      userId,
      categoryId: categoryId
        ? new Types.ObjectId(categoryId as string)
        : undefined,
      tags: tags
        ?.filter((tagId: string) => Types.ObjectId.isValid(tagId))
        ?.map((tagId: string) => new Types.ObjectId(tagId)),
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
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
    const { userId } = RequestContext<{ userId: string }>(req);

    const { id } = req.params;

    await ProductModel.findByIdAndDelete({ _id: id });

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

    if (categoryId) {
      updateDto.categoryId = new Types.ObjectId(categoryId as string);
    }

    if (Array.isArray(tags)) {
      const tagsIds = tags.map((tag) => new Types.ObjectId(tag as string));
      updateDto.tags = tagsIds;
    }

    await ProductModel.findByIdAndUpdate(id, {
      $set: updateDto,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export { createProduct, getProducts, deleteProduct, updateProduct };
