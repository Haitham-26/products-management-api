import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import isString from "lodash/isString";
import { Types } from "mongoose";
import isNil from "lodash/isNil";
import OrderModel, { Order } from "../models/Order.model";
import { Product } from "../models/Product.model";
import { CreateOrderDto } from "../types/order/dto/CreateOrderDto";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { UpdateOrderDto } from "../types/order/dto/UpdateOrderDto";

const createOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { userId, products } = RequestContext<{
      userId: string;
      products: Product[];
    }>(req);

    const { items, note } = req.body as CreateOrderDto;

    const orderItems = items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      quantity: item.quantity,
      priceAtPurchase:
        products.find((product) =>
          product._id.equals(new Types.ObjectId(item.productId)),
        )?.priceAfterDiscount || 0,
    }));

    await OrderModel.create({
      items: orderItems,
      note,
      status: OrderStatus.PENDING,
      totalPriceAtPurchase: orderItems.reduce(
        (total, item) => total + item.priceAtPurchase * item.quantity,
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

    const { keyword, meta, minTotalPrice, maxTotalPrice } = req.query;

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

const deleteOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await OrderModel.findByIdAndDelete({ _id: id });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const updateOrder = async (req: express.Request, res: express.Response) => {
  try {
    const { userId, products } = RequestContext<{
      userId: string;
      products: Product[];
    }>(req);

    const { items, note, orderId } = req.body as UpdateOrderDto;

    const updateQuery = {
      status: OrderStatus.PENDING,
      note,
    } as Partial<UpdateOrderDto>;

    if (items?.length) {
      const orderItems = items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        priceAtPurchase:
          products.find((product) =>
            product._id.equals(new Types.ObjectId(item.productId)),
          )?.priceAfterDiscount || 0,
      }));

      const totalPriceAtPurchase = orderItems.reduce(
        (total, item) => total + item.priceAtPurchase * item.quantity,
        0,
      );

      // @ts-expect-error ..
      updateQuery.items = orderItems;
      // @ts-expect-error ..
      updateQuery.totalPriceAtPurchase = totalPriceAtPurchase;
    }

    await OrderModel.updateOne(
      {
        _id: orderId,
        userId: new Types.ObjectId(userId),
        status: OrderStatus.PENDING,
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
export { createOrder, getOrders, deleteOrder, updateOrder };
