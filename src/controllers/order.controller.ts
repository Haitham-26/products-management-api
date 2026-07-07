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

export class OrderService {
  constructor() {}

  getProductNewQuantity(
    orderItem: OrderItem,
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
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
  }
}

const createOrder: RequestHandler = async (req, res) => {
  try {
    const { scopeId, products } = RequestContext<{
      scopeId: string;
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
          productMainImage: product?.mainImage?.secureUrl,
          productGalleryImages: product?.galleryImages?.map(
            (image) => image.secureUrl,
          ),
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
            userId: scopeId,
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

const getOrders: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

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
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
};

const updateOrder: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

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
    console.log(e);
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
    console.log(e);
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

    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
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
        status: { $ne: OrderStatus.CONFIRMED },
      }).session(session);

      const productBulkOps = orders
        .filter((order) => {
          // Cancelled orders' status cannot be directly changed to CONFIRMED
          if (
            order.status === OrderStatus.CANCELLED &&
            newStatus === OrderStatus.CONFIRMED
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
          status: { $ne: OrderStatus.CONFIRMED },
          ...(newStatus === OrderStatus.CONFIRMED
            ? {
                status: {
                  $nin: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
                },
              }
            : {}),
        },
        { $set: { status: newStatus } },
        { session },
      );

      await ProductModel.bulkWrite(productBulkOps, { session });
    });

    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
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
