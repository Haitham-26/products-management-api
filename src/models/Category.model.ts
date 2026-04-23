import mongoose, { model, Types } from "mongoose";

export interface Category extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  childrenCount: number;
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
    childrenCount: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
