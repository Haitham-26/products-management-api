import mongoose, { model, Types } from "mongoose";

export interface Category extends mongoose.Document {
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

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "The name is required."],
    },
    description: {
      type: String,
      required: false,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Usage count must be at least 0."],
    },
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
      index: true,
    },
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
  { timestamps: true },
);

const CategoryModel = model("Category", CategorySchema);

export default CategoryModel;
