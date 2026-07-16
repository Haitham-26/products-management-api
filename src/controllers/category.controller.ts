import { RequestHandler } from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import CategoryModel, { Category } from "../models/Category.model";
import { QueryOptions, Types } from "mongoose";
import isNil from "lodash/isNil";
import { withTransaction } from "../utils/withTransaction";
import ProductModel from "../models/Product.model";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
import { escapeSpecialChars } from "../utils/String";
import { errorHandler } from "../errors/errorHandler";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";

const createCategory: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { name, description } = req.body;

    await CategoryModel.create({
      name,
      description,
      userId: scopeId,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const getCategories: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { keyword, meta, minUsageCount, maxUsageCount, creationDate } =
      req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      userId: scopeId,
      isDeleted: { $ne: true },
    };

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.$or = [
        { name: { $regex: escapedKeyword, $options: "i" } },
        { description: { $regex: escapedKeyword, $options: "i" } },
      ];
    }

    if (!isNil(minUsageCount) || !isNil(maxUsageCount)) {
      query.usageCount = {};

      if (minUsageCount) {
        query.usageCount.$gte = Number(minUsageCount);
      }

      if (maxUsageCount) {
        query.usageCount.$lte = Number(maxUsageCount);
      }
    }

    const [data, total] = await Promise.all([
      CategoryModel.find(query, {
        name: 1,
        description: 1,
        createdAt: 1,
        usageCount: 1,
      })
        .sort({
          createdAt: getCreatedAtSort(creationDate as CreationDateFilters),
        })
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
      },
    });
  } catch (e) {
    errorHandler(e, res);
  }
};

const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { categoryId } = req.body;

    await withTransaction(async (session) => {
      await ProductModel.updateMany(
        {
          categoryId: new Types.ObjectId(categoryId as string),
          userId: scopeId,
        },
        { $set: { categoryId: null } },
        { session },
      );

      await CategoryModel.updateOne(
        { _id: categoryId, userId: scopeId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const deleteBulkCategories: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { categoryIds } = req.body;

    await withTransaction(async (session) => {
      await ProductModel.updateMany(
        {
          categoryId: { $in: categoryIds },
          userId: scopeId,
        },
        { $set: { categoryId: null } },
        { session },
      );

      await CategoryModel.updateMany(
        { _id: { $in: categoryIds }, userId: scopeId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const updateCategory: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { name, description, categoryId } = req.body;

    const updateDto: Partial<Category> = {};

    if (isString(name)) {
      updateDto.name = name;
    }

    if (isString(description)) {
      updateDto.description = description;
    }

    await CategoryModel.findOneAndUpdate(
      { _id: new Types.ObjectId(categoryId as string), userId: scopeId },
      {
        $set: updateDto,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export {
  createCategory,
  getCategories,
  deleteCategory,
  deleteBulkCategories,
  updateCategory,
};
