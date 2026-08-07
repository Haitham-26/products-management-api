import express, { RequestHandler } from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import TagModel, { Tag } from "../models/Tag.model";
import { QueryOptions } from "mongoose";
import isNil from "lodash/isNil";
import { getSortByDate } from "../utils/getSortByDate";
import { SortKind } from "../types/shared/types/SortKind.enum";
import { escapeSpecialChars } from "../utils/String";
import { errorHandler } from "../errors/errorHandler";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";
import SettingsModel from "../models/Settings.model";
import { DatePeriodFilters } from "../types/shared/types/DatePeriodFilters.enum";
import { getDatePeriodMatch } from "../utils/dateUtils";

const createTag: RequestHandler = async (req, res) => {
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
    errorHandler(e, res);
  }
};

const getTags: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { keyword, meta, minUsageCount, maxUsageCount, sortBy, datePeriod } =
      req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    if (limit > 100) {
      throw new APIError({
        message: APIErrorKeys.hugeRequest,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) ?? 0));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      isDeleted: { $ne: true },
      userId: scopeId,
    };

    const settings = await SettingsModel.findOne({ userId: scopeId }).select(
      "timeZone",
    );

    if (
      datePeriod &&
      Object.values(DatePeriodFilters).includes(datePeriod as DatePeriodFilters)
    ) {
      query.createdAt = getDatePeriodMatch(
        datePeriod as DatePeriodFilters,
        settings?.timeZone,
      );
    }

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
          createdAt: getSortByDate(sortBy as SortKind),
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
    errorHandler(e, res);
  }
};

const deleteTag: RequestHandler = async (req, res) => {
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
    errorHandler(e, res);
  }
};

const deleteBulkTags: RequestHandler = async (req, res) => {
  try {
    const { tags, scopeId } = RequestContext<{ tags: Tag[]; scopeId: string }>(
      req,
    );

    await TagModel.bulkWrite(
      tags.map((tag) => {
        const date = new Date();

        if (tag.usageCount > 0) {
          return {
            updateOne: {
              filter: { _id: tag._id, userId: scopeId },
              update: {
                $set: {
                  isDeleted: true,
                  deletedAt: date,
                },
              },
            },
          };
        } else {
          return {
            deleteOne: {
              filter: { _id: tag._id, userId: scopeId },
            },
          };
        }
      }),
    );

    res.sendStatus(StatusCode.OK);
  } catch (e) {
    errorHandler(e, res);
  }
};

const updateTag: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { tagId } = req.body;

    const { name, description } = req.body;

    const updateDto: Partial<Tag> = {};

    if (isString(name)) {
      updateDto.name = name;
    }

    if (isString(description)) {
      updateDto.description = description;
    }

    await TagModel.findOneAndUpdate(
      { _id: tagId, userId: scopeId },
      {
        $set: updateDto,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export { createTag, getTags, deleteTag, deleteBulkTags, updateTag };
