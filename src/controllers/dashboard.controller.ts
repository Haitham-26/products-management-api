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
    const { datePeriod: _datePeriod } = req.query as {
      datePeriod: DatePeriodFilters;
    };
    const isToday = _datePeriod === DatePeriodFilters.TODAY;

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const settings = await SettingsModel.findOne({ userId: scopeId });

    const minStockDefault = settings?.inventory?.defaultMinStock || 10;
    const timeZone = settings?.timeZone || "UTC";
    const datePeriod = getDatePeriodMatch(_datePeriod, timeZone);

    const baseMatch = { userId: scopeId, isDeleted: { $ne: true } };

    const revenueEligibleMatch = {
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.PARTIALLY_RETURNED] },
      lastDeliveredAt: datePeriod,
    };

    const profitAndRevenueGroupStage: PipelineStage.FacetPipelineStage[] =
      isToday
        ? [
            {
              $group: {
                _id: null,
                revenue: { $sum: "$netRevenue" },
                profit: { $sum: "$netProfit" },
              },
            },
          ]
        : [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$lastDeliveredAt",
                    timezone: timeZone,
                  },
                },
                revenue: { $sum: "$netRevenue" },
                profit: { $sum: "$netProfit" },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", revenue: 1, profit: 1 } },
          ];

    const dashboardQuery = OrderModel.aggregate([
      { $match: baseMatch },
      {
        $facet: {
          orderCountsByStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          profitAndRevenue: [
            { $match: revenueEligibleMatch },
            ...profitAndRevenueGroupStage,
          ],
          mostSoldProducts: [
            { $match: revenueEligibleMatch },
            { $project: { items: 1, returnedItems: 1 } },
            { $unwind: "$items" },
            {
              $addFields: {
                returnedQuantityForItem: {
                  $ifNull: [
                    {
                      $first: {
                        $map: {
                          input: {
                            $filter: {
                              input: { $ifNull: ["$returnedItems", []] },
                              cond: {
                                $eq: ["$$this.productId", "$items.productId"],
                              },
                            },
                          },
                          as: "r",
                          in: "$$r.returnedQuantity",
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
            {
              $addFields: {
                netQuantity: {
                  $subtract: ["$items.quantity", "$returnedQuantityForItem"],
                },
              },
            },
            { $match: { netQuantity: { $gt: 0 } } },
            {
              $group: {
                _id: "$items.productId",
                totalSold: { $sum: "$netQuantity" },
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
                pipeline: [
                  { $project: { name: 1, mainImage: { secureUrl: 1 } } },
                ],
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
          ],
        },
      },
    ]).exec();

    const stockCountsQuery = ProductModel.aggregate([
      { $match: baseMatch },
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

    const [[dashboardResult], stockCounts] = await Promise.all([
      dashboardQuery,
      stockCountsQuery,
    ]);

    const { orderCountsByStatus, profitAndRevenue, mostSoldProducts } =
      dashboardResult;

    const totalRevenue = profitAndRevenue.reduce(
      (sum: number, r: { revenue: number }) => sum + r.revenue,
      0,
    );
    const totalProfit = profitAndRevenue.reduce(
      (sum: number, r: { profit: number }) => sum + r.profit,
      0,
    );

    const getStatusCount = (status: OrderStatus) =>
      orderCountsByStatus.find((o: { _id: OrderStatus }) => o._id === status)
        ?.count || 0;

    res.status(StatusCode.OK).json({
      totalRevenue,
      totalProfit,
      ordersCountByStatus: {
        pending: getStatusCount(OrderStatus.PENDING),
        delivered: getStatusCount(OrderStatus.DELIVERED),
        canceled: getStatusCount(OrderStatus.CANCELED),
        returned: getStatusCount(OrderStatus.RETURNED),
        partiallyReturned: getStatusCount(OrderStatus.PARTIALLY_RETURNED),
      },
      productsCountByStatus: {
        outOfStock: stockCounts[0]?.outOfStockCount || 0,
        lowStock: stockCounts[0]?.lowStockCount || 0,
      },
      profitAndRevenue,
      mostSoldProducts,
    });
  } catch (e) {
    errorHandler(e, res);
  }
};
