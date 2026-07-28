import OrderModel from "../models/Order.model";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestHandler } from "express";
import { RequestContext } from "../utils/RequestContext";
import { errorHandler } from "../errors/errorHandler";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { isValidDate } from "../utils/dateUtils";
import ProductModel from "../models/Product.model";
import SettingsModel from "../models/Settings.model";
import { PipelineStage } from "mongoose";
import dayjs from "dayjs";

export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const _startDate = isValidDate(startDate)
      ? dayjs(startDate as string)
          .startOf("day")
          .toDate()
      : dayjs().startOf("day").toDate();

    const _endDate = isValidDate(endDate)
      ? dayjs(endDate as string)
          .endOf("day")
          .toDate()
      : dayjs().endOf("day").toDate();

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const settings = await SettingsModel.findOne({ userId: scopeId });

    const minStockDefault = settings?.inventory?.defaultMinStock || 10;
    const timeZone = settings?.timeZone || "UTC";
    const datePeriod = {
      $gte: dayjs(_startDate).tz(timeZone).toDate(),
      $lte: dayjs(_endDate).tz(timeZone).toDate(),
    };

    const orderBaseMatch = { userId: scopeId, isArchived: { $ne: true } };
    const productBaseMatch = { userId: scopeId, isDeleted: { $ne: true } };

    const revenueEligibleMatch = {
      status: { $in: [OrderStatus.DELIVERED, OrderStatus.PARTIALLY_RETURNED] },
      lastDeliveredAt: datePeriod,
    };

    const profitAndRevenueGroupStage: PipelineStage.FacetPipelineStage[] = [
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

    const orderCountsQuery = OrderModel.aggregate([
      { $match: orderBaseMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec();

    const revenueQuery = OrderModel.aggregate([
      { $match: { ...orderBaseMatch, ...revenueEligibleMatch } },
      {
        $facet: {
          profitAndRevenue: profitAndRevenueGroupStage,
          mostSoldProducts: [
            { $project: { items: 1, returnedItems: 1 } },
            {
              $addFields: {
                returnedMap: {
                  $arrayToObject: {
                    $map: {
                      input: { $ifNull: ["$returnedItems", []] },
                      as: "r",
                      in: {
                        k: { $toString: "$$r.productId" },
                        v: "$$r.returnedQuantity",
                      },
                    },
                  },
                },
              },
            },
            { $unwind: "$items" },
            {
              $addFields: {
                netQuantity: {
                  $subtract: [
                    "$items.quantity",
                    {
                      $ifNull: [
                        {
                          $getField: {
                            field: { $toString: "$items.productId" },
                            input: "$returnedMap",
                          },
                        },
                        0,
                      ],
                    },
                  ],
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
      { $match: productBaseMatch },
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

    const [orderCountsByStatus, [revenueResult], stockCounts] =
      await Promise.all([orderCountsQuery, revenueQuery, stockCountsQuery]);

    const { profitAndRevenue, mostSoldProducts } = revenueResult;

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
