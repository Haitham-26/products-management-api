import express from "express";
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
import { OrderVisibility } from "../types/order/types/OrderVisibility.enum";
import { generateIdentifier } from "./counter.controller";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
import { escapeSpecialChars } from "../utils/String";

const createOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { userId, products } = RequestContext<{
      userId: string;
      products: Product[];
    }>(req);

    const { items, note, customerName, customerPhone, customerEmail } =
      req.body as CreateOrderDto;

    await withTransaction(async (session) => {
      const orderItems: OrderItem[] = items.map((item) => {
        const product = products.find((product) =>
          product._id.equals(new Types.ObjectId(item.productId)),
        )!;

        return {
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          priceAtPurchase: product.price || 0,
          discountAtPurchase: product?.discount,
          finalPrice: ProductService.calculatePriceAfterDiscount(
            product?.price || 0,
            product?.discount,
          ),
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
            identifier,
            items: orderItems,
            note,
            status: OrderStatus.PENDING,
            totalPriceAtPurchase: orderItems.reduce(
              (total, item) => total + item.finalPrice * item.quantity,
              0,
            ),
            userId,
          },
        ],
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getOrders = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const {
      keyword,
      meta,
      minTotalPrice,
      maxTotalPrice,
      status,
      showArchived,
      creationDate,
    } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      userId: new Types.ObjectId(userId as string),
    };

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.$or = [
        { identifier: { $regex: escapedKeyword || "", $options: "i" } },
        { note: { $regex: escapedKeyword || "", $options: "i" } },
        { customerPhone: { $regex: escapedKeyword || "", $options: "i" } },
        { customerName: { $regex: escapedKeyword || "", $options: "i" } },
        { customerEmail: { $regex: escapedKeyword || "", $options: "i" } },
      ];
    }

    if (showArchived !== "true") {
      query.isArchived = false;
    }

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      query.status = status;
    }

    if (!isNil(minTotalPrice) || !isNil(maxTotalPrice)) {
      query.totalPriceAtPurchase = {};

      if (minTotalPrice) {
        query.totalPriceAtPurchase.$gte = Number(minTotalPrice);
      }

      if (maxTotalPrice) {
        query.totalPriceAtPurchase.$lte = Number(maxTotalPrice);
      }
    }

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
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: currentPage < Math.ceil(total / pageSize),
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
};

const updateOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const {
      note,
      customerName,
      customerPhone,
      isArchived,
      orderId,
      customerEmail,
    } = req.body as UpdateOrderDto;

    const updateQuery: UpdateQuery<Order> = {
      note,
      customerName,
      customerPhone,
      customerEmail,
    };

    if (isBoolean(isArchived)) {
      updateQuery.isArchived = isArchived;
    }

    console.log(isArchived);

    await OrderModel.updateOne(
      {
        _id: orderId,
        userId: new Types.ObjectId(userId),
      },
      {
        $set: updateQuery,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const manageOrderStatus = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { orderId, status } = req.body;

    const { order } = RequestContext<{ order: Order }>(req);

    const currentStatus = order.status;
    const newStatus = status;

    const getProductNewQuantity = (orderItem: OrderItem) => {
      if (
        currentStatus === OrderStatus.PENDING &&
        newStatus === OrderStatus.CONFIRMED
      ) {
        return 0;
      }

      if (
        currentStatus === OrderStatus.PENDING &&
        newStatus === OrderStatus.CANCELLED
      ) {
        return orderItem.quantity;
      }

      if (
        currentStatus === OrderStatus.CANCELLED &&
        newStatus === OrderStatus.PENDING
      ) {
        return -orderItem.quantity;
      }

      return 0;
    };

    await withTransaction(async (session) => {
      const bulkOps = order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId, isDeleted: { $ne: true } },
          update: {
            $inc: {
              quantity: getProductNewQuantity(item),
            },
          },
        },
      }));

      await ProductModel.bulkWrite(bulkOps, { session });

      await OrderModel.updateOne(
        { _id: orderId },
        { $set: { status: newStatus } },
        { session },
      );
    });

    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
};

export { createOrder, getOrders, updateOrder, manageOrderStatus };
