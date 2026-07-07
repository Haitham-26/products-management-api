import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  bulkManageProductStatus,
  createProduct,
  deleteBulkProducts,
  deleteProduct,
  getProducts,
  manageProductStock,
  updateProduct,
} from "../controllers/product.controller";
import { CreateProductValidator } from "../validators/product/create-product.validator";
import { UpdateProductValidator } from "../validators/product/update-product.validator";
import { ManageProductStockValidator } from "../validators/product/manage-product-stock.validator";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";
import { UserPermissionsMiddleware } from "../middlewares/UserPermissionsMiddleware";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { BulkManageProductStatusValidator } from "../validators/product/bulk-manage-product-status.validator";
import upload from "../middlewares/UploadImageMiddleware";

const productRouter = express.Router();

productRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  getProducts,
);
productRouter.delete(
  "/delete",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  deleteProduct,
);
productRouter.delete(
  "/delete/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  deleteBulkProducts,
);
productRouter.post(
  "/create",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.CREATE,
    CRUDPermissions.READ,
  ]),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 5 },
  ]),
  OrgScopeMiddleware,
  CreateProductValidator,
  createProduct,
);

productRouter.patch(
  "/update",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 5 },
  ]),
  OrgScopeMiddleware,
  UpdateProductValidator,
  updateProduct,
);
productRouter.patch(
  "/manage-status/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  BulkManageProductStatusValidator,
  bulkManageProductStatus,
);
productRouter.patch(
  "/manage-stock",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  ManageProductStockValidator,
  manageProductStock,
);

export default productRouter;
