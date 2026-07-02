import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import TagModel, { Tag } from "../models/Tag.model";
import { QueryOptions } from "mongoose";
import isNil from "lodash/isNil";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
import { escapeSpecialChars } from "../utils/String";

const createTag = async (req: express.Request, res: express.Response) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { name, description } = req.body;

    await TagModel.create({
      name,
      description,
      userId: scopeId,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getTags = async (req: express.Request, res: express.Response) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { keyword, meta, minUsageCount, maxUsageCount, creationDate } =
      req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      isDeleted: { $ne: true },
      userId: scopeId,
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
      TagModel.find(query, {
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
      TagModel.countDocuments(query),
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
    console.error(e);
    res.status(500).send();
  }
};

const deleteTag = async (req: express.Request, res: express.Response) => {
  try {
    const { tag, scopeId } = RequestContext<{ tag: Tag; scopeId: string }>(req);

    if (tag.usageCount > 0) {
      await TagModel.updateOne(
        { _id: tag._id, userId: scopeId },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        },
      );
    } else {
      await TagModel.deleteOne({ _id: tag._id, userId: scopeId });
    }

    res.sendStatus(StatusCode.OK);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
};

const updateTag = async (req: express.Request, res: express.Response) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { id } = req.params;

    const { name, description } = req.body;

    const updateDto: Partial<Tag> = {};

    if (isString(name)) {
      updateDto.name = name;
    }

    if (isString(description)) {
      updateDto.description = description;
    }

    await TagModel.findOneAndUpdate(
      { _id: id, userId: scopeId },
      {
        $set: updateDto,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export { createTag, getTags, deleteTag, updateTag };
