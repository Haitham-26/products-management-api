import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductByID,
  updateProduct,
} from "../controllers/product.controller";

const productRouter = express.Router();

productRouter.get("/", getAllProducts);

productRouter.get("/:id", getProductByID);

productRouter.post("/create", createProduct);

productRouter.delete("/:id", deleteProduct);

productRouter.put("/:id", updateProduct);

export default productRouter;
