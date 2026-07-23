import mongoose, { model, Types } from "mongoose";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface Tag extends mongoose.Document {
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

const TagSchema = new mongoose.Schema(
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
    isDeleted: {
      type: SchemaTypes.Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: SchemaTypes.Date,
      default: null,
    },
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
  },
  { timestamps: true },
);

const TagModel = model("Tag", TagSchema);

export default TagModel;
