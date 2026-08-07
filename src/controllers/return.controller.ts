import { RequestHandler } from "express";
import { errorHandler } from "../errors/errorHandler";
import { RequestContext } from "../utils/RequestContext";
import { escapeSpecialChars } from "../utils/String";
import isString from "lodash/isString";
import { QueryOptions } from "mongoose";
import ReturnModel, { Return } from "../models/Return.model";
import { getSortByDate } from "../utils/getSortByDate";
import { SortKind } from "../types/shared/types/SortKind.enum";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { DatePeriodFilters } from "../types/shared/types/DatePeriodFilters.enum";
import { getDatePeriodMatch } from "../utils/dateUtils";
import { CreateReturnDto } from "../types/return/dto/CreateReturnDto";
import { withTransaction } from "../utils/withTransaction";
import { OrderItem } from "../types/order/types/OrderItem";
import OrderModel, { Order } from "../models/Order.model";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";
import { ReturnStatus } from "../types/return/types/ReturnStatus.enum";
import { ReturnItem } from "../types/return/types/ReturnItem";
import ProductModel from "../models/Product.model";
import SettingsModel from "../models/Settings.model";

class ReturnService {
  contructor() {}

  static getAreAllOrderItemsReturned(
    orderItems: OrderItem[],
    returnItems: ReturnItem[] | CreateReturnDto["items"],
  ) {
    return orderItems.every((orderItem: OrderItem) => {
      const returnItem = returnItems.find((returnItem) => {
        return orderItem.productId.equals(returnItem.productId);
      });

      if (!returnItem) {
        return false;
      }

      const areAllOrderItemsReturned =
        returnItem.returnedQuantity === orderItem.quantity;

      return areAllOrderItemsReturned;
    });
  }
}

const getReturns: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { keyword, meta, status, sortBy, datePeriod } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    if (limit > 100) {
      throw new APIError({
        message: APIErrorKeys.hugeRequest,
        status: StatusCode.BAD_REQUEST,
      });
    }

    const currentPage = Math.max(1, Number(page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(limit ?? 0)));
    const skip = (currentPage - 1) * pageSize;

    const settings = await SettingsModel.findOne({ userId: scopeId }).select(
      "timeZone",
    );

    const query: QueryOptions = {
      userId: scopeId,
    };

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.orderIdentifier = { $regex: escapedKeyword || "", $options: "i" };
    }

    if (
      status &&
      Object.values(ReturnStatus).includes(status as ReturnStatus)
    ) {
      query.status = status;
    }

    if (
      datePeriod &&
      Object.values(DatePeriodFilters).includes(datePeriod as DatePeriodFilters)
    ) {
      query.returnedAt = getDatePeriodMatch(
        datePeriod as DatePeriodFilters,
        settings?.timeZone,
      );
    }

    const [data, total] = await Promise.all([
      ReturnModel.find(query)
        .sort({
          returnedAt: getSortByDate(sortBy as SortKind),
        })
        .skip(skip)
        .limit(pageSize),
      ReturnModel.countDocuments(query),
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

const createReturn: RequestHandler = async (req, res) => {
  try {
    const { scopeId, order } = RequestContext<{
      scopeId: string;
      order: Order;
    }>(req);

    const { orderId, returnReason, items } = req.body as CreateReturnDto;

    const returnItems: ReturnItem[] = items.map((returnItem) => {
      const orderItem = order.items.find((oi) =>
        oi.productId.equals(returnItem.productId),
      );

      if (!orderItem) {
        throw new APIError({
          status: StatusCode.NOT_FOUND,
          message: APIErrorKeys.internal,
        });
      }

      return {
        productId: orderItem.productId,
        productName: orderItem.productName,
        productMainImage: orderItem.productMainImage,
        restockedQuantity: returnItem.restockedQuantity,
        returnedQuantity: returnItem.returnedQuantity,
        totalProfit: returnItem.returnedQuantity * orderItem.profitAtPurchase,
        totalRevenue:
          returnItem.returnedQuantity * orderItem.finalSalePriceAtPurchase,
      };
    });

    const totalReturnRevenue = returnItems.reduce(
      (s, i) => s + i.totalRevenue,
      0,
    );
    const totalReturnProfit = returnItems.reduce(
      (s, i) => s + i.totalProfit,
      0,
    );

    await withTransaction(async (session) => {
      await ReturnModel.create(
        [
          {
            userId: scopeId,
            orderId,
            orderIdentifier: order.identifier,
            returnReason,
            items: returnItems,
            totalReturnRevenue,
            totalReturnProfit,
            status: ReturnStatus.ACTIVE,
            returnedAt: new Date(),
          },
        ],
        { session },
      );

      const areAllOrderItemsReturned =
        ReturnService.getAreAllOrderItemsReturned(order.items, items);

      await OrderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            status: areAllOrderItemsReturned
              ? OrderStatus.RETURNED
              : OrderStatus.PARTIALLY_RETURNED,
            netProfit: order.totalProfit - totalReturnProfit,
            netRevenue: order.totalRevenue - totalReturnRevenue,
            returnedItems: items.map((item) => ({
              productId: item.productId,
              returnedQuantity: item.returnedQuantity,
            })),
          },
        },
        { session },
      );

      const productBulkWrites = items.map((item) => ({
        updateOne: {
          filter: {
            _id: item.productId,
            userId: scopeId,
            isDeleted: { $ne: true },
          },
          update: {
            $inc: {
              quantity: item.restockedQuantity,
            },
          },
        },
      }));

      await ProductModel.bulkWrite(productBulkWrites, { session });
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const updateReturn: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { returnId, returnReason } = req.body;

    await ReturnModel.updateOne(
      { _id: returnId, userId: scopeId },
      { $set: { returnReason } },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const cancelReturn: RequestHandler = async (req, res) => {
  try {
    const { scopeId, _return } = RequestContext<{
      scopeId: string;
      _return: Return;
    }>(req);

    await withTransaction(async (session) => {
      await ReturnModel.updateOne(
        { _id: _return._id, userId: scopeId },
        { $set: { status: ReturnStatus.CANCELED, canceledAt: new Date() } },
        { session },
      );

      await OrderModel.updateOne(
        { _id: _return.orderId, userId: scopeId },
        [
          {
            $set: {
              status: OrderStatus.DELIVERED,
              netProfit: "$totalProfit",
              netRevenue: "$totalRevenue",
            },
          },
          { $unset: "returnedItems" },
        ],
        { session },
      );

      const productBulkWrites = _return.items.map((item) => ({
        updateOne: {
          filter: {
            _id: item.productId,
            userId: scopeId,
            isDeleted: { $ne: true },
          },
          update: {
            $inc: {
              quantity: -item.restockedQuantity,
            },
          },
        },
      }));

      await ProductModel.bulkWrite(productBulkWrites, { session });
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const activateReturn: RequestHandler = async (req, res) => {
  try {
    const { scopeId, _return, order } = RequestContext<{
      scopeId: string;
      _return: Return;
      order: Order;
    }>(req);

    await withTransaction(async (session) => {
      await ReturnModel.updateOne(
        { _id: _return._id, userId: scopeId },
        { $set: { status: ReturnStatus.ACTIVE, canceledAt: null } },
        { session },
      );

      const areAllOrderItemsReturned =
        ReturnService.getAreAllOrderItemsReturned(order.items, _return.items);

      await OrderModel.updateOne(
        { _id: _return.orderId, userId: scopeId },
        {
          $set: {
            status: areAllOrderItemsReturned
              ? OrderStatus.RETURNED
              : OrderStatus.PARTIALLY_RETURNED,
            netProfit: order.totalProfit - _return.totalReturnProfit,
            netRevenue: order.totalRevenue - _return.totalReturnRevenue,
            returnedItems: _return.items.map((item) => ({
              productId: item.productId,
              returnedQuantity: item.returnedQuantity,
            })),
          },
        },
        { session },
      );

      const productBulkWrites = _return.items.map((item) => ({
        updateOne: {
          filter: {
            _id: item.productId,
            userId: scopeId,
            isDeleted: { $ne: true },
          },
          update: {
            $inc: {
              quantity: item.restockedQuantity,
            },
          },
        },
      }));

      await ProductModel.bulkWrite(productBulkWrites, { session });
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export { getReturns, createReturn, updateReturn, cancelReturn, activateReturn };
