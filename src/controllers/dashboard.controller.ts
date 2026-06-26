import OrderModel from "../models/Order.model";
import ProductModel from "../models/Product.model";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import express from "express";
import { RequestContext } from "../utils/RequestContext";
import SettingsModel from "../models/Settings.model";

export const getDashboardStats = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    console.log(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOf7Days = new Date(startOfToday);
    startOf7Days.setDate(startOf7Days.getDate() - 7);

    const startOf30Days = new Date(startOfToday);
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    const settings = await SettingsModel.findOne(
      { userId },
      { "inventory.defaultMinStock": 1 },
    ).lean();

    const minStockDefault = settings?.inventory?.defaultMinStock || 10;

    const matchStage = {
      $match: {
        userId,
        isDeleted: { $ne: true },
      },
    };

    const byDateGroup = {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        todayCount: {
          $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] },
        },
        lastWeekCount: {
          $sum: { $cond: [{ $gte: ["$createdAt", startOf7Days] }, 1, 0] },
        },
        lastMonthCount: {
          $sum: { $cond: [{ $gte: ["$createdAt", startOf30Days] }, 1, 0] },
        },
      },
    };

    const [productsByDate, ordersByDate, stockCounts, mostSoldProducts] =
      await Promise.all([
        ProductModel.aggregate([matchStage, byDateGroup]).exec(),
        OrderModel.aggregate([matchStage, byDateGroup]).exec(),
        ProductModel.aggregate([
          matchStage,
          {
            $project: {
              isOutOfStock: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] },
              isLowStock: {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$quantity", 0] },
                      {
                        $lte: [
                          "$quantity",
                          { $ifNull: ["$minStock", minStockDefault] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              outOfStockCount: { $sum: "$isOutOfStock" },
              lowStockCount: { $sum: "$isLowStock" },
            },
          },
        ]).exec(),
        OrderModel.aggregate([
          matchStage,
          { $project: { items: 1 } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              totalSold: { $sum: "$items.quantity" },
            },
          },
          { $sort: { totalSold: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "product",
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          { $unwind: "$product" },
          {
            $project: {
              _id: 0,
              productId: "$_id",
              name: "$product.name",
              totalSold: 1,
            },
          },
        ]).exec(),
      ]);

    const productsByDateResult = productsByDate[0] || {};
    const ordersByDateResult = ordersByDate[0] || {};
    const stockResult = stockCounts[0] || {};

    res.status(StatusCode.OK).json({
      products: {
        totalCount: productsByDateResult.totalCount || 0,
        todayCount: productsByDateResult.todayCount || 0,
        lastWeekCount: productsByDateResult.lastWeekCount || 0,
        lastMonthCount: productsByDateResult.lastMonthCount || 0,
      },
      lowStockProducts: {
        totalCount: stockResult.lowStockCount || 0,
      },
      outOfStockProducts: {
        totalCount: stockResult.outOfStockCount || 0,
      },
      orders: {
        totalCount: ordersByDateResult.totalCount || 0,
        todayCount: ordersByDateResult.todayCount || 0,
        lastWeekCount: ordersByDateResult.lastWeekCount || 0,
        lastMonthCount: ordersByDateResult.lastMonthCount || 0,
      },
      mostSoldProducts,
    });
  } catch (e) {
    console.error(e);
    res.status(StatusCode.INTERNAL_ERROR).json({
      message: "Failed to load dashboard stats",
    });
  }
};
