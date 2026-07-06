import { Types } from "mongoose";
import { ProductDiscount } from "../../product/types/ProductDiscount";

export interface OrderItem {
  productId: Types.ObjectId;
  productName: string;
  productMainImage?: string;
  productGalleryImages?: string[];
  quantity: number;
  priceAtPurchase: number;
  discountAtPurchase?: ProductDiscount;
  finalPrice: number;
}
