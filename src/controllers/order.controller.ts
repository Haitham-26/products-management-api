import express, { RequestHandler } from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import { QueryOptions, Types, UpdateQuery } from "mongoose";
import isNil from "lodash/isNil";
import OrderModel, { Order } from "../models/Order.model";
import ProductModel, { Product } from "../models/Product.model";
import { CreateOrderDto } from "../types/order/dto/CreateOrderDto";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { UpdateOrderDto } from "../types/order/dto/UpdateOrderDto";
import { withTransaction } from "../utils/withTransaction";
import { OrderItem } from "../types/order/types/OrderItem";
import { ProductService } from "./product.controller";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";
import isBoolean from "lodash/isBoolean";
import { generateIdentifier } from "./counter.controller";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
import { escapeSpecialChars } from "../utils/String";
import { OrderVisibility } from "../types/order/types/OrderVisibility.enum";
import { errorHandler } from "../errors/errorHandler";

export class OrderService {
  constructor() {}

  getProductNewQuantity(
    orderItem: OrderItem,
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    if (
      currentStatus === OrderStatus.PENDING &&
      newStatus === OrderStatus.DELIVERED
    ) {
      return 0;
    }

    if (
      currentStatus === OrderStatus.PENDING &&
      newStatus === OrderStatus.CANCELED
    ) {
      return orderItem.quantity;
    }

    if (
      currentStatus === OrderStatus.CANCELED &&
      newStatus === OrderStatus.PENDING
    ) {
      return -orderItem.quantity;
    }

    return 0;
  }
}

const createOrder: RequestHandler = async (req, res) => {
  try {
    const { scopeId, products } = RequestContext<{
      scopeId: string;
      products: Product[];
    }>(req);

    const {
      items,
      note,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
    } = req.body as CreateOrderDto;

    await withTransaction(async (session) => {
      const orderItems: OrderItem[] = items.map((item) => {
        const product = products.find((product) =>
          product._id.equals(new Types.ObjectId(item.productId)),
        )!;

        return {
          productId: product._id,
          productName: product.name,
          productMainImage: product?.mainImage?.secureUrl,
          productGalleryImages: product?.galleryImages?.map(
            (image) => image.secureUrl,
          ),
          quantity: item.quantity,
          purchasePriceAtPurchase: product.purchasePrice,
          salePriceAtPurchase: product.salePrice,
          finalSalePriceAtPurchase: product.finalSalePrice,
          totalProfitAtPurchase: product.profit * item.quantity,
          discountAtPurchase: product?.discount,
        };
      });

      const bulkOps = orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.productId, isDeleted: { $ne: true } },
          update: {
            $inc: {
              quantity: -item.quantity,
            },
          },
        },
      }));

      await ProductModel.bulkWrite(bulkOps, { session });

      const identifier = await generateIdentifier(
        req,
        CounterKeys.ORDER,
        session,
      );

      await OrderModel.create(
        [
          {
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            identifier,
            items: orderItems,
            note,
            status: OrderStatus.PENDING,
            totalAmount: orderItems.reduce(
              (total, item) =>
                total + item.finalSalePriceAtPurchase * item.quantity,
              0,
            ),
            totalProfit: orderItems.reduce(
              (total, item) => total + item.totalProfitAtPurchase,
              0,
            ),
            userId: scopeId,
          },
        ],
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const getOrders: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const {
      keyword,
      meta,
      minTotalAmount,
      maxTotalAmount,
      minTotalProfit,
      maxTotalProfit,
      status,
      showArchived,
      creationDate,
    } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      userId: scopeId,
    };

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.$or = [
        { identifier: { $regex: escapedKeyword || "", $options: "i" } },
        { note: { $regex: escapedKeyword || "", $options: "i" } },
        { customerPhone: { $regex: escapedKeyword || "", $options: "i" } },
        { customerName: { $regex: escapedKeyword || "", $options: "i" } },
        { customerEmail: { $regex: escapedKeyword || "", $options: "i" } },
        { customerAddress: { $regex: escapedKeyword || "", $options: "i" } },
      ];
    }

    if (showArchived !== "true") {
      query.isArchived = false;
    }

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      query.status = status;
    }

    const rangeFilters = {
      totalAmount: [minTotalAmount, maxTotalAmount],
      totalProfit: [minTotalProfit, maxTotalProfit],
    };

    Object.entries(rangeFilters).forEach(([key, [min, max]]) => {
      if (!isNil(min) || !isNil(max)) {
        query[key] = {};

        if (min) {
          query[key].$gte = Number(min);
        }

        if (max) {
          query[key].$lte = Number(max);
        }
      }
    });

    const [data, total] = await Promise.all([
      OrderModel.find(query)
        .sort({
          createdAt: getCreatedAtSort(creationDate as CreationDateFilters),
        })
        .skip(skip)
        .limit(pageSize),
      OrderModel.countDocuments(query),
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

const updateOrder: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const {
      note,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      isArchived,
      orderId,
    } = req.body as UpdateOrderDto;

    const updateQuery: UpdateQuery<Order> = {
      note,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
    };

    if (isBoolean(isArchived)) {
      updateQuery.isArchived = isArchived;
    }

    await OrderModel.updateOne(
      {
        _id: orderId,
        userId: scopeId,
      },
      {
        $set: updateQuery,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const bulkManageOrderVisibility: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { orderIds, visibility } = req.body;

    await OrderModel.updateMany(
      {
        _id: { $in: orderIds },
        userId: scopeId,
      },
      {
        $set: {
          isArchived: visibility === OrderVisibility.ARCHIVED,
        },
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const manageOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const { order, scopeId } = RequestContext<{
      order: Order;
      scopeId: string;
    }>(req);

    const currentStatus = order.status;
    const newStatus = status;

    const orderService = new OrderService();

    await withTransaction(async (session) => {
      const bulkOps = order.items.map((item) => ({
        updateOne: {
          filter: {
            userId: scopeId,
            _id: item.productId,
            isDeleted: { $ne: true },
          },
          update: {
            $inc: {
              quantity: orderService.getProductNewQuantity(
                item,
                currentStatus,
                newStatus,
              ),
            },
          },
        },
      }));

      await ProductModel.bulkWrite(bulkOps, { session });

      await OrderModel.updateOne(
        { _id: orderId, userId: scopeId },
        { $set: { status: newStatus } },
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const bulkManageOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { orderIds, status: newStatus } = req.body;

    const { scopeId } = RequestContext<{
      scopeId: string;
    }>(req);

    const orderService = new OrderService();

    await withTransaction(async (session) => {
      const orders = await OrderModel.find({
        _id: { $in: orderIds },
        userId: scopeId,
        isDeleted: { $ne: true },
        status: { $ne: OrderStatus.DELIVERED },
      }).session(session);

      const productBulkOps = orders
        .filter((order) => {
          // Canceled orders' status cannot be directly changed to DELIVERED
          if (
            order.status === OrderStatus.CANCELED &&
            newStatus === OrderStatus.DELIVERED
          ) {
            return false;
          } else {
            return true;
          }
        })
        .flatMap((order) =>
          order.items
            .flatMap((item) => item)
            .map((item) => ({
              updateOne: {
                filter: {
                  userId: scopeId,
                  _id: item.productId,
                  isDeleted: { $ne: true },
                },
                update: {
                  $inc: {
                    quantity: orderService.getProductNewQuantity(
                      item.toObject() as unknown as OrderItem,
                      order.status,
                      newStatus,
                    ),
                  },
                },
              },
            })),
        );

      await OrderModel.updateMany(
        {
          _id: { $in: orderIds },
          userId: scopeId,
          isDeleted: { $ne: true },
          status: { $ne: OrderStatus.DELIVERED },
          ...(newStatus === OrderStatus.DELIVERED
            ? {
                status: {
                  $nin: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
                },
              }
            : {}),
        },
        { $set: { status: newStatus } },
        { session },
      );

      await ProductModel.bulkWrite(productBulkOps, { session });
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export {
  createOrder,
  getOrders,
  updateOrder,
  bulkManageOrderVisibility,
  manageOrderStatus,
  bulkManageOrderStatus,
};
