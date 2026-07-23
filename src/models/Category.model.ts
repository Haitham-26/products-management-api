import { model, Schema, Types, Document } from "mongoose";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface Category extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  usageCount: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
}

const CategorySchema = new Schema(
  {
    name: {
      type: SchemaTypes.String,
      required: [true, "The name is required."],
    },
    description: {
      type: SchemaTypes.String,
      required: false,
    },
    usageCount: {
      type: SchemaTypes.Number,
      default: 0,
      min: [0, "Usage count must be at least 0."],
    },
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
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
  { timestamps: true },
);

const CategoryModel = model("Category", CategorySchema);

export default CategoryModel;
