import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import ProductModel, { Product } from "../models/Product.model";
import { OrderService } from "../controllers/order.controller";
import { Order } from "../models/Order.model";

type StockCheckResult = {
  insufficientStockProductIds: string[];
  productMap: Map<string, Product>;
  orderIdentifiersByProductId: Map<string, string[]>;
};

export const checkOrderProductsStockAvailability = async (
  orders: Order[],
  newStatus: OrderStatus,
  scopeId: string,
): Promise<StockCheckResult> => {
  const orderService = new OrderService();

  const quantityByProductId = new Map<string, number>();
  const orderIdentifiersByProductId = new Map<string, string[]>();

  for (const order of orders) {
    for (const item of order.items) {
      const quantity = orderService.getProductNewQuantity(
        item,
        order.status,
        newStatus,
      );

      if (quantity >= 0) {
        continue;
      }

      const id = item.productId.toString();

      quantityByProductId.set(
        id,
        (quantityByProductId.get(id) || 0) + quantity,
      );

      const existingOrderIdentifiers =
        orderIdentifiersByProductId.get(id) || [];

      if (!existingOrderIdentifiers.includes(order.identifier)) {
        existingOrderIdentifiers.push(order.identifier);
      }

      orderIdentifiersByProductId.set(id, existingOrderIdentifiers);
    }
  }

  let insufficientStockProductIds: string[] = [];
  let productMap = new Map<string, Product>();

  if (quantityByProductId.size > 0) {
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

  return {
    insufficientStockProductIds,
    productMap,
    orderIdentifiersByProductId,
  };
};

export const buildInsufficientStockMessage = (
  insufficientStockProductIds: string[],
  productMap: Map<string, Product>,
  orderIdentifiersByProductId: Map<string, string[]>,
): string => {
  const productIdsByOrderIdentifier = new Map<string, string[]>();

  for (const productId of insufficientStockProductIds) {
    const orderIdentifiers = orderIdentifiersByProductId.get(productId) || [];

    for (const orderIdentifier of orderIdentifiers) {
      const existing = productIdsByOrderIdentifier.get(orderIdentifier) || [];

      existing.push(productId);

      productIdsByOrderIdentifier.set(orderIdentifier, existing);
    }
  }

  const productLabel = (id: string) => {
    const product = productMap.get(id);
    return product?.name || id;
  };

  const messages = Array.from(productIdsByOrderIdentifier.entries()).map(
    ([orderIdentifier, productIds]) => {
      const labels = productIds.map(productLabel).join(", ");

      return `Order ${orderIdentifier}: insufficient stock for ${labels}`;
    },
  );

  return messages.join(". ");
};
