import mongoose, { model, Types } from "mongoose";
import { ProductDiscount } from "../types/product/types/ProductDiscount";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";

export interface Product extends mongoose.Document {
  _id: Types.ObjectId;
  identifier: string;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount?: ProductDiscount;
  priceAfterDiscount?: number;
  categoryId?: Types.ObjectId;
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
    },
    name: {
      type: String,
      required: [true, "The name is required."],
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
