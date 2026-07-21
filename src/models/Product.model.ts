import mongoose, { model, Types } from "mongoose";
import { ProductDiscount } from "../types/product/types/ProductDiscount";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";
import { ProductStatus } from "../types/product/types/ProductStatus.enum";
import { CloudinaryImage } from "../types/shared/types/CloudinaryImage";

export interface Product extends mongoose.Document {
  _id: Types.ObjectId;
  identifier: string;
  userId: Types.ObjectId;
  name: string;
  status: ProductStatus;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  finalSalePrice: number;
  profit: number;
  quantity: number;
  minStock?: number;
  discount?: ProductDiscount;
  categoryId?: Types.ObjectId | null;
  tags?: Types.ObjectId[];
  mainImage?: CloudinaryImage | null;
  galleryImages?: CloudinaryImage[];
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
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.PUBLISHED,
    },
    description: {
      type: String,
      required: false,
    },
    purchasePrice: {
      type: Number,
      required: [true, "The purchase price is required."],
      min: [0, "Purchase price must be at least 0."],
    },
    salePrice: {
      type: Number,
      required: [true, "The sale price is required."],
      min: [0, "Sale price must be at least 0."],
    },
    finalSalePrice: {
      type: Number,
      required: [true, "The final sale price is required."],
      min: [0, "Final sale price must be at least 0."],
    },
    profit: {
      type: Number,
      required: [true, "The profit is required."],
    },
    quantity: {
      type: Number,
      required: [true, "The quantity is required."],
      min: [0, "Quantity must be at least 1."],
    },
    minStock: {
      type: Number,
      default: 10,
      min: [1, "Minimum stock must be at least 1."],
    },
    discount: {
      type: {
        type: String,
        enum: Object.values(ProductDiscountTypes),
      },
      value: {
        type: Number,
        min: [0, "Discount value must be at least 0."],
      },
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
    mainImage: {
      type: {
        publicId: String,
        secureUrl: String,
      },
    },
    galleryImages: [
      {
        type: {
          publicId: String,
          secureUrl: String,
        },
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
