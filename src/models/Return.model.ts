import { Document, model, Schema, Types } from "mongoose";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";
import { ReturnItem } from "../types/return/types/ReturnItem";
import { ReturnStatus } from "../types/return/types/ReturnStatus.enum";

export interface Return extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  orderIdentifier: string;
  items: ReturnItem[];
  totalReturnRevenue: number;
  totalReturnProfit: number;
  status: ReturnStatus;
  returnReason: string;
  returnedAt: Date;
  voidedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<ReturnItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, "The product id is required."],
    },
    productMainImage: {
      type: SchemaTypes.String,
    },
    productName: {
      type: SchemaTypes.String,
      required: [true, "The product name is required."],
    },
    returnedQuantity: {
      type: SchemaTypes.Number,
      required: [true, "The returned quantity is required."],
    },
    restockedQuantity: {
      type: SchemaTypes.Number,
      required: [true, "The restocked quantity is required."],
    },
    totalRevenue: {
      type: SchemaTypes.Number,
      required: [true, "The total revenue is required."],
    },
    totalProfit: {
      type: SchemaTypes.Number,
      required: [true, "The total profit is required."],
    },
  },
  { _id: false },
);

const ReturnSchema = new Schema<Return>(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
    orderId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The orderId is required."],
      index: true,
    },
    orderIdentifier: {
      type: SchemaTypes.String,
      required: [true, "The order identifier is required."],
    },
    items: {
      type: [ReturnItemSchema],
      required: [true, "The order items is required."],
    },
    returnReason: {
      type: SchemaTypes.String,
      required: [true, "The return reason is required."],
    },
    totalReturnRevenue: {
      type: SchemaTypes.Number,
      required: [true, "The total return revenue is required."],
    },
    totalReturnProfit: {
      type: SchemaTypes.Number,
      required: [true, "The total return profit is required."],
    },
    status: {
      type: SchemaTypes.String,
      enum: Object.values(ReturnStatus),
      default: ReturnStatus.COMPLETED,
    },
    returnedAt: {
      type: SchemaTypes.Date,
      default: Date.now,
    },
    voidedAt: {
      type: SchemaTypes.Date,
      default: null,
    },
  },
  { timestamps: true },
);

const ReturnModel = model("Return", ReturnSchema);

export default ReturnModel;
