import mongoose, { model, Types } from "mongoose";
import { ProductDiscount } from "../types/product/types/ProductDiscount";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";
import { ProductStatus } from "../types/product/types/ProductStatus.enum";

export interface Product extends mongoose.Document {
  _id: Types.ObjectId;
  identifier: string;
  userId: Types.ObjectId;
  name: string;
  status: ProductStatus;
  description?: string;
  price: number;
  quantity: number;
  minStock?: number;
  discount?: ProductDiscount;
  priceAfterDiscount?: number;
  categoryId?: Types.ObjectId | null;
  tags?: Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
}

const ProductSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: [true, "The identifier is required."],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "The name is required."],
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.PUBLISHED,
    },
    description: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: [true, "The price is required."],
    },
    quantity: {
      type: Number,
      required: [true, "The quantity is required."],
    },
    minStock: {
      type: Number,
      required: false,
      default: 10,
    },
    discount: {
      type: {
        type: String,
        enum: Object.values(ProductDiscountTypes),
      },
      value: {
        type: Number,
      },
    },
    priceAfterDiscount: {
      type: Number,
    },
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
    },
    tags: [
      {
        type: Types.ObjectId,
        ref: "Tag",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

ProductSchema.virtual("category", {
  ref: "Category",
  localField: "categoryId",
  foreignField: "_id",
  justOne: true,
});

const ProductModel = model("Product", ProductSchema);

export default ProductModel;
