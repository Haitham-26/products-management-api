import { RequestHandler } from "express";
import { errorHandler } from "../errors/errorHandler";
import { RequestContext } from "../utils/RequestContext";
import { escapeSpecialChars } from "../utils/String";
import isString from "lodash/isString";
import { QueryOptions } from "mongoose";
import ReturnModel from "../models/Return.model";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
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

const getReturns: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { keyword, meta, status, creationDate, datePeriod } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(limit ?? 0)));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      userId: scopeId,
    };

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.orderIdentifier = { $regex: escapedKeyword || "", $options: "i" };
    }

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      query.status = status;
    }

    if (
      datePeriod &&
      Object.values(DatePeriodFilters).includes(datePeriod as DatePeriodFilters)
    ) {
      query.returnedAt = getDatePeriodMatch(datePeriod as DatePeriodFilters);
    }

    const [data, total] = await Promise.all([
      ReturnModel.find(query)
        .sort({
          returnedAt: getCreatedAtSort(creationDate as CreationDateFilters),
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

    const getAreAllOrderItemsReturned = () => {
      return order.items.every((orderItem: OrderItem) => {
        const returnItem = items.find((returnItem) =>
          orderItem.productId.equals(returnItem.productId),
        );

        if (!returnItem) {
          return false;
        }

        const areAllOrderItemsReturned =
          returnItem.returnedQuantity === orderItem.quantity;

        return areAllOrderItemsReturned;
      });
    };

    await withTransaction(async (session) => {
      const itemsTotalProfitAndRevenue = items.map((item) => {
        const orderItem = order.items.find((orderItem) =>
          orderItem.productId.equals(item.productId),
        );

        if (!orderItem) {
          throw new APIError({
            status: StatusCode.NOT_FOUND,
            message: APIErrorKeys.internal,
          });
        }

        return {
          totalReturnRevenue:
            item.returnedQuantity * orderItem.finalSalePriceAtPurchase,
          totalReturnProfit: item.returnedQuantity * orderItem.profitAtPurchase,
        };
      });

      await ReturnModel.create(
        [
          {
            userId: scopeId,
            orderId,
            orderIdentifier: order.identifier,
            returnReason,
            items: items.map((returnItem: CreateReturnDto["items"][number]) => {
              const orderItem = order.items.find((orderItem) =>
                orderItem.productId.equals(returnItem.productId),
              )!;

              return {
                productId: orderItem.productId,
                productName: orderItem.productName,
                productMainImage: orderItem.productMainImage,
                restockedQuantity: returnItem.restockedQuantity,
                returnedQuantity: returnItem.returnedQuantity,
                totalProfit:
                  returnItem.returnedQuantity * orderItem.profitAtPurchase,
                totalRevenue:
                  returnItem.returnedQuantity *
                  orderItem.finalSalePriceAtPurchase,
              };
            }) as ReturnItem[],
            totalReturnRevenue: itemsTotalProfitAndRevenue.reduce(
              (acc, item) => acc + item.totalReturnRevenue,
              0,
            ),
            totalReturnProfit: itemsTotalProfitAndRevenue.reduce(
              (acc, item) => acc + item.totalReturnProfit,
              0,
            ),
            status: ReturnStatus.COMPLETED,
            returnedAt: new Date(),
          },
        ],
        { session },
      );

      await OrderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            status: getAreAllOrderItemsReturned()
              ? OrderStatus.RETURNED
              : OrderStatus.PARTIALLY_RETURNED,
          },
        },
        { session },
      );

      const productBulkWrites = items.map((item) => ({
        updateOne: {
          filter: {
            _id: item.productId,
            userId: scopeId,
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

export { getReturns, createReturn };
