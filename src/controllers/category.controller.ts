import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import CategoryModel, { Category } from "../models/Category.model";
import ProductModel from "../models/Product.model";
import { Types } from "mongoose";

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

    const categoriesWithChildrenCount = await CategoryModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categoryId",
          as: "productMatches",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          childrenCount: { $size: "$productMatches" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(StatusCode.OK).json(categoriesWithChildrenCount);
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
};

const deleteCategory = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await CategoryModel.findByIdAndDelete({ _id: id });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const updateCategory = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const { name, description, price } = req.body;

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
