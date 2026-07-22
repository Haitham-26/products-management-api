import OrderModel from "../models/Order.model";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestHandler } from "express";
import { RequestContext } from "../utils/RequestContext";
import { errorHandler } from "../errors/errorHandler";
import { DatePeriodFilters } from "../types/shared/types/DatePeriodFilters.enum";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { getDatePeriodMatch } from "../utils/dateUtils";
import ProductModel from "../models/Product.model";
import SettingsModel from "../models/Settings.model";
import { PipelineStage } from "mongoose";

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const { datePeriod } = req.query as { datePeriod: DatePeriodFilters };
    const isToday = datePeriod === DatePeriodFilters.TODAY;

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const settings = await SettingsModel.findOne({ userId: scopeId });

    const minStockDefault = settings?.inventory?.defaultMinStock || 10;

    const matchStage = {
      $match: {
        userId: scopeId,
        isDeleted: { $ne: true },
      },
    };

    const totalProfitAndRevenueQuery = OrderModel.aggregate([
      {
        $match: {
          ...matchStage["$match"],
          status: OrderStatus.DELIVERED,
          lastDeliveredAt: getDatePeriodMatch(datePeriod),
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
    ]).exec();

    const outOfStockAndLowStockCountQuery = ProductModel.aggregate([
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
    ]).exec();

    const orderCountsByStatusQuery = OrderModel.aggregate([
      matchStage,
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const profitAndRevenuePipeline: PipelineStage[] = [
      {
        $match: {
          ...matchStage["$match"],
          status: OrderStatus.DELIVERED,
          lastDeliveredAt: getDatePeriodMatch(datePeriod),
        },
      },
    ];

    if (isToday) {
      profitAndRevenuePipeline.push({
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          profit: { $sum: "$totalProfit" },
        },
      });
    } else {
      profitAndRevenuePipeline.push(
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$lastDeliveredAt",
              },
            },
            revenue: { $sum: "$totalAmount" },
            profit: { $sum: "$totalProfit" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: 1,
            profit: 1,
          },
        },
      );
    }

    const profitAndRevenueQuery = OrderModel.aggregate(
      profitAndRevenuePipeline,
    ).exec();

    const mostSoldProductsQuery = OrderModel.aggregate([
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
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
          pipeline: [{ $project: { name: 1, mainImage: { secureUrl: 1 } } }],
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$product.name",
          image: "$product.mainImage.secureUrl",
          totalSold: 1,
        },
      },
    ]).exec();

    const [
      totalProfitAndRevenueResult,
      orderCountsByStatusResult,
      outOfStockAndLowStockCounts,
      profitAndRevenueResult,
      mostSoldProducts,
    ] = await Promise.all([
      totalProfitAndRevenueQuery,
      orderCountsByStatusQuery,
      outOfStockAndLowStockCountQuery,
      profitAndRevenueQuery,
      mostSoldProductsQuery,
    ]);

    const totalRevenue = totalProfitAndRevenueResult[0]?.totalRevenue || 0;
    const totalProfit = totalProfitAndRevenueResult[0]?.totalProfit || 0;

    const lowStockProductsCount =
      outOfStockAndLowStockCounts[0]?.outOfStockCount || 0;
    const outOfStockProductsCount =
      outOfStockAndLowStockCounts[0]?.lowStockCount || 0;

    const pendingOrdersCount =
      orderCountsByStatusResult.find((o) => o._id === OrderStatus.PENDING)
        ?.count || 0;
    const deliveredOrdersCount =
      orderCountsByStatusResult.find((o) => o._id === OrderStatus.DELIVERED)
        ?.count || 0;
    const canceledOrdersCount =
      orderCountsByStatusResult.find((o) => o._id === OrderStatus.CANCELED)
        ?.count || 0;

    res.status(StatusCode.OK).json({
      totalRevenue,
      totalProfit,
      ordersCountByStatus: {
        pending: pendingOrdersCount,
        delivered: deliveredOrdersCount,
        canceled: canceledOrdersCount,
      },
      productsCountByStatus: {
        outOfStock: outOfStockProductsCount,
        lowStock: lowStockProductsCount,
      },
      profitAndRevenue: profitAndRevenueResult,
      mostSoldProducts,
    });
  } catch (e) {
    errorHandler(e, res);
  }
};
