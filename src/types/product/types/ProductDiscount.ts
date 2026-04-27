import { ProductDiscountTypes } from "./ProductDiscountTypes.enum";

export interface ProductDiscount {
  type: ProductDiscountTypes;
  value: number;
}
