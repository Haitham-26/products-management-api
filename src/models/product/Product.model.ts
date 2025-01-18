import mongoose, { model } from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

const Product = model("Product", ProductSchema);

export default Product;
