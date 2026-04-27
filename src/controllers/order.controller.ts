import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import { Types } from "mongoose";
import isNil from "lodash/isNil";
import OrderModel, { Order } from "../models/Order.model";
import ProductModel, { Product } from "../models/Product.model";
import { CreateOrderDto } from "../types/order/dto/CreateOrderDto";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { UpdateOrderDto } from "../types/order/dto/UpdateOrderDto";
import { withTransaction } from "../utils/withTransaction";
import { OrderItem } from "../types/order/types/OrderItem";
import { ProductService } from "./product.controller";

const createOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { userId, products } = RequestContext<{
      userId: string;
      products: Product[];
    }>(req);

    const { items, note } = req.body as CreateOrderDto;

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

    await OrderModel.create({
      items: orderItems,
      note,
      status: OrderStatus.PENDING,
      totalPriceAtPurchase: orderItems.reduce(
        (total, item) => total + item.finalPrice * item.quantity,
        0,
      ),
      userId,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getOrders = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { keyword, meta, minTotalPrice, maxTotalPrice, status } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: any = {
      userId: new Types.ObjectId(userId as string),
    };

    if (isString(keyword)) {
      query.note = { $regex: keyword, $options: "i" };
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
      OrderModel.find(query, {
        items: 1,
        note: 1,
        status: 1,
        totalPriceAtPurchase: 1,
        createdAt: 1,
      })
        .sort({ createdAt: -1 })
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

    const { note, orderId } = req.body as UpdateOrderDto;

    await OrderModel.updateOne(
      {
        _id: orderId,
        userId: new Types.ObjectId(userId),
        status: OrderStatus.PENDING,
      },
      {
        $set: { note },
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

    const oldStatus = order.status;
    const newStatus = status;

    const shouldDecrease =
      oldStatus !== OrderStatus.CONFIRMED &&
      newStatus === OrderStatus.CONFIRMED;

    const shouldIncrease =
      oldStatus === OrderStatus.CONFIRMED &&
      newStatus !== OrderStatus.CONFIRMED;

    await withTransaction(async (session) => {
      if (shouldDecrease || shouldIncrease) {
        const bulkOps = order.items.map((item) => ({
          updateOne: {
            filter: { _id: item.productId, isDeleted: { $ne: true } },
            update: {
              $inc: {
                quantity: shouldDecrease ? -item.quantity : item.quantity,
              },
            },
          },
        }));

        await ProductModel.bulkWrite(bulkOps, { session });
      }

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
