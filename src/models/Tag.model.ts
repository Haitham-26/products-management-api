import mongoose, { model, Types } from "mongoose";

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
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
    },
  },
  { timestamps: true },
);

const TagModel = model("Tag", TagSchema);

export default TagModel;
