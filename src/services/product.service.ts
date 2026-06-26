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
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";

const productRouter = express.Router();

productRouter.get("/", AuthMiddleware, OrgScopeMiddleware, getProducts);
productRouter.delete(
  "/:id/delete",
  AuthMiddleware,
  OrgScopeMiddleware,
  deleteProduct,
);
productRouter.post(
  "/create",
  AuthMiddleware,
  OrgScopeMiddleware,
  CreateProductValidator,
  createProduct,
);
productRouter.patch(
  "/:id/update",
  AuthMiddleware,
  OrgScopeMiddleware,
  UpdateProductValidator,
  updateProduct,
);
productRouter.patch(
  "/:id/manage-stock",
  AuthMiddleware,
  OrgScopeMiddleware,
  ManageProductStockValidator,
  manageProductStock,
);

export default productRouter;
