import express from "express";
import { RequestContext } from "../utils/RequestContext";
import ProductModel from "../models/Product.model";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { Types } from "mongoose";
import SettingsModel from "../models/Settings.model";
import OrderModel from "../models/Order.model";

export const getDashboardStats = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);
    const userObjectId = new Types.ObjectId(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOf7Days = new Date();
    startOf7Days.setHours(0, 0, 0, 0);
    startOf7Days.setDate(startOf7Days.getDate() - 7);

    const startOf30Days = new Date();
    startOf30Days.setHours(0, 0, 0, 0);
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    const settings = await SettingsModel.findOne({ userId });
    const minStockDefault = settings?.inventory?.defaultMinStock || 10;

    const [productsAggregation, ordersAggregation] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: { $ne: true },
          },
        },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            todayCount: [
              { $match: { createdAt: { $gte: startOfToday } } },
              { $count: "count" },
            ],
            lastWeekCount: [
              {
                $match: {
                  createdAt: {
                    $gte: startOf7Days,
                    $lt: startOfToday,
                  },
                },
              },
              { $count: "count" },
            ],
            lastMonthCount: [
              {
                $match: {
                  createdAt: {
                    $gte: startOf30Days,
                    $lt: startOfToday,
                  },
                },
              },
              { $count: "count" },
            ],
            outOfStockProducts: [
              { $match: { quantity: 0 } },
              { $count: "count" },
            ],
            lowStockProducts: [
              {
                $match: {
                  $expr: {
                    $lte: [
                      "$quantity",
                      { $ifNull: ["$minStock", minStockDefault] },
                    ],
                  },
                  quantity: { $gt: 0 },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            userId: userObjectId,
            isDeleted: { $ne: true },
          },
        },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            todayCount: [
              { $match: { createdAt: { $gte: startOfToday } } },
              { $count: "count" },
            ],
            lastWeekCount: [
              {
                $match: {
                  createdAt: {
                    $gte: startOf7Days,
                    $lt: startOfToday,
                  },
                },
              },
              { $count: "count" },
            ],
            lastMonthCount: [
              {
                $match: {
                  createdAt: {
                    $gte: startOf30Days,
                    $lt: startOfToday,
                  },
                },
              },
              { $count: "count" },
            ],
            mostSoldProducts: [
              {
                $match: {
                  userId: userObjectId,
                  isDeleted: { $ne: true },
                },
              },

              {
                $group: {
                  _id: "$productId",
                  totalSold: { $sum: "$quantity" }, // أو 1 حسب النظام
                },
              },

              {
                $sort: { totalSold: -1 },
              },

              {
                $limit: 5,
              },

              {
                $lookup: {
                  from: "products",
                  localField: "_id",
                  foreignField: "_id",
                  as: "product",
                },
              },

              {
                $unwind: "$product",
              },

              {
                $project: {
                  _id: 0,
                  productId: "$_id",
                  name: "$product.name",
                  quantity: "$totalSold",
                },
              },
            ],
          },
        },
      ]),
    ]);

    const productsResult = productsAggregation[0] || {};
    const ordersResult = ordersAggregation[0] || {};

    res.status(StatusCode.OK).json({
      products: {
        totalCount: productsResult.totalCount?.[0]?.count || 0,
        todayCount: productsResult.todayCount?.[0]?.count || 0,
        lastWeekCount: productsResult.lastWeekCount?.[0]?.count || 0,
        lastMonthCount: productsResult.lastMonthCount?.[0]?.count || 0,
      },
      lowStockProducts: {
        totalCount: productsResult.lowStockProducts?.[0]?.count || 0,
      },
      outOfStockProducts: {
        totalCount: productsResult.outOfStockProducts?.[0]?.count || 0,
      },
      orders: {
        totalCount: ordersResult.totalCount?.[0]?.count || 0,
        todayCount: ordersResult.todayCount?.[0]?.count || 0,
        lastWeekCount: ordersResult.lastWeekCount?.[0]?.count || 0,
        lastMonthCount: ordersResult.lastMonthCount?.[0]?.count || 0,
      },
      mostSoldProducts: ordersResult.mostSoldProducts || [],
    });
  } catch (e) {
    console.error(e);
    res.status(StatusCode.INTERNAL_ERROR).json({
      message: "Failed to load dashboard stats",
    });
  }
};
