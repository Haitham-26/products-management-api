import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createProduct,
  deleteProduct,
  getProducts,
  manageProductStock,
  updateProduct,
} from "../controllers/product.controller";
import { CreateProductValidator } from "../validators/product/create-product.validator";
import { UpdateProductValidator } from "../validators/product/update-product.validator";
import { ManageProductStockValidator } from "../validators/product/manage-product-stock.validator";

const productRouter = express.Router();

productRouter.get("/", AuthMiddleware, getProducts);
productRouter.delete("/:id/delete", AuthMiddleware, deleteProduct);
productRouter.post(
  "/create",
  AuthMiddleware,
  CreateProductValidator,
  createProduct,
);
productRouter.patch(
  "/:id/update",
  AuthMiddleware,
  UpdateProductValidator,
  updateProduct,
);
productRouter.patch(
  "/:id/manage-stock",
  AuthMiddleware,
  ManageProductStockValidator,
  manageProductStock,
);

export default productRouter;
