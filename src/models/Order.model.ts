import mongoose, { model, Types } from "mongoose";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { OrderItem } from "../types/order/types/OrderItem";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";

export interface Order extends mongoose.Document {
  _id: Types.ObjectId;
  identifier: string;
  userId: Types.ObjectId;
  items: OrderItem[];
  note?: string;
  status: OrderStatus;
  totalPriceAtPurchase: number;
  createdAt: string;
  updatedAt: string;
}

const OrderSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: [true, "The identifier is required."],
    },
    items: {
      type: [
        {
          productId: {
            type: Types.ObjectId,
            required: [true, "The productId is required."],
          },
          productName: {
            type: String,
            required: [true, "The product name is required."],
          },
          quantity: {
            type: Number,
            required: [true, "The quantity is required."],
          },
          priceAtPurchase: {
            type: Number,
            required: [true, "The price at purchase is required."],
          },
          discountAtPurchase: {
            type: {
              type: String,
              enum: Object.values(ProductDiscountTypes),
            },
            value: {
              type: Number,
            },
          },
          finalPrice: {
            type: Number,
            required: false,
          },
        },
      ],
      required: [true, "The items is required."],
    },
    note: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: [true, "The status is required."],
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    totalPriceAtPurchase: {
      type: Number,
      required: [true, "The total price at purchase is required."],
    },
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
    },
  },
  { timestamps: true },
);

const OrderModel = model("Order", OrderSchema);

export default OrderModel;
