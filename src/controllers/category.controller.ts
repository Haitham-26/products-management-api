import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import CategoryModel, { Category } from "../models/Category.model";
import { Types } from "mongoose";
import isNil from "lodash/isNil";
import { withTransaction } from "../utils/withTransaction";
import ProductModel from "../models/Product.model";

const createCategory = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { name, description } = req.body;

    await CategoryModel.create({
      name,
      description,
      userId,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getCategories = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { keyword, meta, minChildrenCount, maxChildrenCount } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: any = {
      userId: new Types.ObjectId(userId as string),
    };

    if (isString(keyword)) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (!isNil(minChildrenCount) || !isNil(maxChildrenCount)) {
      query.childrenCount = {};

      if (minChildrenCount) {
        query.childrenCount.$gte = Number(minChildrenCount);
      }

      if (maxChildrenCount) {
        query.childrenCount.$lte = Number(maxChildrenCount);
      }
    }

    const [data, total] = await Promise.all([
      CategoryModel.find(query, {
        name: 1,
        description: 1,
        createdAt: 1,
        childrenCount: 1,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      CategoryModel.countDocuments(query),
    ]);

    res.status(StatusCode.OK).json({
      data,
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
    console.log(e);
    res.status(500).send();
  }
};

const deleteCategory = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await withTransaction(async (session) => {
      const category = await CategoryModel.findById(id).session(session);

      if (!category) {
        return;
      }

      await ProductModel.updateMany(
        { categoryId: new Types.ObjectId(id) },
        { $set: { categoryId: null } },
        { session },
      );

      await CategoryModel.deleteOne({ _id: id }, { session });
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const updateCategory = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const { name, description } = req.body;

    const updateDto: Partial<Category> = {};

    if (isString(name)) {
      updateDto.name = name;
    }

    if (isString(description)) {
      updateDto.description = description;
    }

    await CategoryModel.findByIdAndUpdate(id, {
      $set: updateDto,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export { createCategory, getCategories, deleteCategory, updateCategory };
