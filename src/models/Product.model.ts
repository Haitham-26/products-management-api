import { Document, model, Schema, Types } from "mongoose";
import { ProductDiscount } from "../types/product/types/ProductDiscount";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";
import { ProductStatus } from "../types/product/types/ProductStatus.enum";
import { CloudinaryImage } from "../types/shared/types/CloudinaryImage";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface Product extends Document {
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

const ProductSchema = new Schema(
  {
    identifier: {
      type: SchemaTypes.String,
      required: [true, "The identifier is required."],
    },
    name: {
      type: SchemaTypes.String,
      required: [true, "The name is required."],
    },
    status: {
      type: SchemaTypes.String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.PUBLISHED,
    },
    description: {
      type: SchemaTypes.String,
      required: false,
    },
    purchasePrice: {
      type: SchemaTypes.Number,
      required: [true, "The purchase price is required."],
      min: [0, "Purchase price must be at least 0."],
    },
    salePrice: {
      type: SchemaTypes.Number,
      required: [true, "The sale price is required."],
      min: [0, "Sale price must be at least 0."],
    },
    finalSalePrice: {
      type: SchemaTypes.Number,
      required: [true, "The final sale price is required."],
      min: [0, "Final sale price must be at least 0."],
    },
    profit: {
      type: SchemaTypes.Number,
      required: [true, "The profit is required."],
    },
    quantity: {
      type: SchemaTypes.Number,
      required: [true, "The quantity is required."],
      min: [0, "Quantity must be at least 1."],
    },
    minStock: {
      type: SchemaTypes.Number,
      default: 10,
      min: [1, "Minimum stock must be at least 1."],
    },
    discount: {
      type: {
        type: SchemaTypes.String,
        enum: Object.values(ProductDiscountTypes),
      },
      value: {
        type: SchemaTypes.Number,
        min: [0, "Discount value must be at least 0."],
      },
    },
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
    categoryId: {
      type: SchemaTypes.ObjectId,
      ref: "Category",
    },
    tags: [
      {
        type: SchemaTypes.ObjectId,
        ref: "Tag",
      },
    ],
    mainImage: {
      type: {
        publicId: SchemaTypes.String,
        secureUrl: SchemaTypes.String,
      },
    },
    galleryImages: [
      {
        type: {
          publicId: SchemaTypes.String,
          secureUrl: SchemaTypes.String,
        },
      },
    ],
    isDeleted: {
      type: SchemaTypes.Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: SchemaTypes.Date,
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
