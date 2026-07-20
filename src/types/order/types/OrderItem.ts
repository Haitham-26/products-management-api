import { Types } from "mongoose";
import { ProductDiscount } from "../../product/types/ProductDiscount";

export interface OrderItem {
  productId: Types.ObjectId;
  productName: string;
  // Here, we store images' secure urls
  productMainImage?: string;
  productGalleryImages?: string[];
  quantity: number;
  purchasePriceAtPurchase: number;
  salePriceAtPurchase: number;
  discountAtPurchase?: ProductDiscount;
  finalSalePriceAtPurchase: number;
  totalProfit: number;
}
