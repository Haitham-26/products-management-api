import express from "express";
import { Types } from "mongoose";
import z from "zod";
import { OrderStatus } from "../../types/order/types/OrderStatus.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { RequestContext } from "../../utils/RequestContext";
import OrderModel from "../../models/Order.model";
import ProductModel, { Product } from "../../models/Product.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { OrderItem } from "../../types/order/types/OrderItem";
import { OrderService } from "../../controllers/order.controller";

const manageOrderStatusSchema = z
  .object({
    orderId: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid orderId",
    }),
    status: z.enum(Object.keys(OrderStatus)),
  })
  .loose();

export const ManageOrderStatusValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const body = manageOrderStatusSchema.parse(req.body);
    req.body = body;

    const order = await OrderModel.findOne({
      _id: body.orderId,
      userId: scopeId,
    });

    if (!order) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Order not found" });
      return;
    }

    if (order.status === OrderStatus.CONFIRMED) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Confirmed order's status cannot be changed" });
      return;
    }

    if (order.status.toLowerCase() === body.status.toLowerCase()) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "The order is already in this status" });
      return;
    }

    if (
      order.status === OrderStatus.CANCELLED &&
      body.status === OrderStatus.CONFIRMED
    ) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Cancelled order's status cannot be changed to confirmed. ",
      });
      return;
    }

    const orderService = new OrderService();

    const itemsWithQuantities = order.items.map((item) => ({
      item,
      quantity: orderService.getProductNewQuantity(
        item.toObject() as unknown as OrderItem,
        order.status,
        body.status as OrderStatus,
      ),
    }));

    const itemsToCheck = itemsWithQuantities.filter(
      ({ quantity }) => quantity < 0,
    );

    let insufficientStockProductIds: string[] = [];
    let productMap = new Map<string, Product>();

    if (itemsToCheck.length > 0) {
      const quantityByProductId = new Map<string, number>();

      for (const { item, quantity } of itemsToCheck) {
        const id = item.productId.toString();

        quantityByProductId.set(
          id,
          (quantityByProductId.get(id) || 0) + quantity,
        );
      }

      const productIds = Array.from(quantityByProductId.keys());

      const foundProducts = await ProductModel.find(
        {
          _id: { $in: productIds },
          userId: scopeId,
          isDeleted: { $ne: true },
        },
        { quantity: 1, name: 1 },
      );

      productMap = new Map(
        foundProducts.map((p) => [p._id.toString(), p as unknown as Product]),
      );

      insufficientStockProductIds = productIds.filter((productId) => {
        const requiredQuantity = quantityByProductId.get(productId)!;
        const product = productMap.get(productId);

        const availableQuantity = product?.quantity || 0;

        return availableQuantity < -requiredQuantity;
      });
    }

    if (insufficientStockProductIds.length > 0) {
      const productLabels = insufficientStockProductIds.map((id) => {
        const product = productMap.get(id);

        return product?.name;
      });

      res.status(StatusCode.BAD_REQUEST).send({
        message: `Insufficient stock for the following products: ${productLabels.join(", ")}.`,
      });
      return;
    }

    RequestContext(req, { order });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
