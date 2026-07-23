import { Document, model, Schema, Types } from "mongoose";
import { OrderStatus } from "../types/order/types/OrderStatus.enum";
import { OrderItem } from "../types/order/types/OrderItem";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface Order extends Document {
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
  lastDeliveredAt?: Date;
  lastCanceledAt?: Date;
  lastPendingAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema(
  {
    identifier: {
      type: SchemaTypes.String,
      required: [true, "The identifier is required."],
    },
    customerName: {
      type: SchemaTypes.String,
      required: [true, "The customer name is required."],
    },
    customerPhone: {
      type: SchemaTypes.String,
      required: false,
    },
    customerEmail: {
      type: SchemaTypes.String,
      required: false,
    },
    customerAddress: {
      type: SchemaTypes.String,
      required: false,
    },
    items: {
      type: [
        {
          productId: {
            type: SchemaTypes.ObjectId,
            required: [true, "The productId is required."],
          },
          productName: {
            type: SchemaTypes.String,
            required: [true, "The product name is required."],
          },
          productMainImage: {
            type: SchemaTypes.String,
            required: false,
          },
          productGalleryImages: {
            type: [SchemaTypes.String],
            required: false,
          },
          quantity: {
            type: SchemaTypes.Number,
            required: [true, "The quantity is required."],
            min: [1, "Quantity must be at least 1."],
          },
          purchasePriceAtPurchase: {
            type: SchemaTypes.Number,
            required: [true, "The purchase price at purchase is required."],
            min: [0, "Purchase price at purchase must be at least 0."],
          },
          salePriceAtPurchase: {
            type: SchemaTypes.Number,
            required: [true, "The sale price at purchase is required."],
            min: [0, "Sale price at purchase must be at least 0."],
          },
          discountAtPurchase: {
            type: {
              type: SchemaTypes.String,
              enum: Object.values(ProductDiscountTypes),
            },
            value: {
              type: SchemaTypes.Number,
              min: [0, "Discount value must be at least 0."],
            },
          },
          finalSalePriceAtPurchase: {
            type: SchemaTypes.Number,
            required: true,
            min: [0, "Final sale price must be at least 0."],
          },
          profitAtPurchase: {
            type: SchemaTypes.Number,
            required: [true, "The profit at purchase is required."],
          },
          totalProfitAtPurchase: {
            type: SchemaTypes.Number,
            required: [true, "The total profit at purchase is required."],
          },
        },
      ],
      required: [true, "The items is required."],
    },
    note: {
      type: SchemaTypes.String,
      required: false,
    },
    status: {
      type: SchemaTypes.String,
      required: [true, "The status is required."],
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    totalAmount: {
      type: SchemaTypes.Number,
      required: [true, "The total price at purchase is required."],
      min: [0, "Total price at purchase must be at least 0."],
    },
    totalProfit: {
      type: SchemaTypes.Number,
      required: [true, "The total profit is required."],
    },
    isArchived: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
    lastDeliveredAt: {
      type: SchemaTypes.Date,
      default: null,
    },
    lastCanceledAt: {
      type: SchemaTypes.Date,
      default: null,
    },
    lastPendingAt: {
      type: SchemaTypes.Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const OrderModel = model("Order", OrderSchema);

export default OrderModel;
