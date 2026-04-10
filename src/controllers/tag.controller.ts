import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import ProductModel from "../models/Product.model";
import TagModel, { Tag } from "../models/Tag.model";
import { Types } from "mongoose";

const createTag = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { name, description } = req.body;

    await TagModel.create({
      name,
      description,
      userId,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getTags = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const tagsWithUsageCount = await TagModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "tags",
          as: "productMatches",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          usageCount: { $size: "$productMatches" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(StatusCode.OK).json(tagsWithUsageCount);
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
};

const deleteTag = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await TagModel.findByIdAndDelete({ _id: id });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const updateTag = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const { name, description } = req.body;

    const updateDto: Partial<Tag> = {};

    if (isString(name)) {
      updateDto.name = name;
    }

    if (isString(description)) {
      updateDto.description = description;
    }

    await TagModel.findByIdAndUpdate(id, {
      $set: updateDto,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export { createTag, getTags, deleteTag, updateTag };
