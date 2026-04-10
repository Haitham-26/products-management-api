import mongoose, { model, Types } from "mongoose";

export interface Product extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount?: {
    type: "percentage" | "fixed";
    value: number;
  };
  categoryId?: Types.ObjectId;
  tags?: Types.ObjectId[];
  createdAt: string;
  updatedAt: string;
}

const ProductSchema = new mongoose.Schema(
  {
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
        enum: ["percentage", "fixed"],
      },
      value: {
        type: Number,
      },
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
