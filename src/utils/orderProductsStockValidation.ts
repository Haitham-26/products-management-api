import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import ProductModel, { Product } from "../models/Product.model";
import { OrderService } from "../controllers/order.controller";
import { Order } from "../models/Order.model";

type StockCheckResult = {
  insufficientStockProductIds: string[];
  productMap: Map<string, Product>;
};

export const checkOrderProductsStockAvailability = async (
  orders: Order[],
  newStatus: OrderStatus,
  scopeId: string,
): Promise<StockCheckResult> => {
  const orderService = new OrderService();

  const quantityByProductId = new Map<string, number>();

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

  return { insufficientStockProductIds, productMap };
};

export const buildInsufficientStockMessage = (
  insufficientStockProductIds: string[],
  productMap: Map<string, Product>,
): string => {
  const productLabels = insufficientStockProductIds.map((id) => {
    const product = productMap.get(id);

    return product?.name || id;
  });

  return `Insufficient stock for the following products: ${productLabels.join(", ")}.`;
};
