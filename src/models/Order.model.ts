import mongoose, { model, Types } from "mongoose";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { OrderItem } from "../types/order/types/OrderItem";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";

export interface Order extends mongoose.Document {
  _id: Types.ObjectId;
  identifier: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  userId: Types.ObjectId;
  items: OrderItem[];
  note?: string;
  status: OrderStatus;
  /**
   * @description Total amount paid by the customer (final sale price).
   */
  totalAmount: number;
  /**
   * @description Total profit generated from the items.
   */
  totalProfit: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const OrderSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: [true, "The identifier is required."],
    },
    customerName: {
      type: String,
      required: [true, "The customer name is required."],
    },
    customerPhone: {
      type: String,
      required: false,
    },
    customerEmail: {
      type: String,
      required: false,
    },
    customerAddress: {
      type: String,
      required: false,
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
          productMainImage: {
            type: String,
            required: false,
          },
          productGalleryImages: {
            type: [String],
            required: false,
          },
          quantity: {
            type: Number,
            required: [true, "The quantity is required."],
            min: [1, "Quantity must be at least 1."],
          },
          purchasePriceAtPurchase: {
            type: Number,
            required: [true, "The purchase price at purchase is required."],
            min: [0, "Purchase price at purchase must be at least 0."],
          },
          salePriceAtPurchase: {
            type: Number,
            required: [true, "The sale price at purchase is required."],
            min: [0, "Sale price at purchase must be at least 0."],
          },
          discountAtPurchase: {
            type: {
              type: String,
              enum: Object.values(ProductDiscountTypes),
            },
            value: {
              type: Number,
              min: [0, "Discount value must be at least 0."],
            },
          },
          finalSalePriceAtPurchase: {
            type: Number,
            required: true,
            min: [0, "Final sale price must be at least 0."],
          },
          totalProfitAtPurchase: {
            type: Number,
            required: [true, "The total profit at purchase is required."],
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
    totalAmount: {
      type: Number,
      required: [true, "The total price at purchase is required."],
      min: [0, "Total price at purchase must be at least 0."],
    },
    totalProfit: {
      type: Number,
      required: [true, "The total profit is required."],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
  },
  { timestamps: true },
);

const OrderModel = model("Order", OrderSchema);

export default OrderModel;
