import { Types } from "mongoose";

export interface ReturnItem {
  productId: Types.ObjectId;
  productName: string;
  productMainImage?: string;
  returnedQuantity: number;
  restockedQuantity: number;
  totalRevenue: number;
  totalProfit: number;
}
