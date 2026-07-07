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
  userId: Types.ObjectId;
  items: OrderItem[];
  note?: string;
  status: OrderStatus;
  totalPriceAtPurchase: number;
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
