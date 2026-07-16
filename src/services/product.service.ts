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
import { DeleteProductValidator } from "../validators/product/delete-product.validator";
import { BulkDeleteProductsValidator } from "../validators/product/bulk-delete-products.validator";

const productRouter = express.Router();
/**
 * @openapi
 * /products/:
 *   get:
 *     summary: Gets user's products
 *     description: Returns all user's products paginated, sorted and filtered.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "Iphone 13"
 *       - in: query
 *         name: minBasePrice
 *         schema:
 *           type: integer
 *           example: 500
 *       - in: query
 *         name: maxBasePrice
 *         schema:
 *           type: integer
 *           example: 2000
 *       - in: query
 *         name: minFinalPrice
 *         schema:
 *           type: integer
 *           example: 500
 *       - in: query
 *         name: maxFinalPrice
 *         schema:
 *           type: integer
 *           example: 2000
 *       - in: query
 *         name: minQuantity
 *         schema:
 *           type: integer
 *           example: 5
 *       - in: query
 *         name: maxQuantity
 *         schema:
 *           type: integer
 *           example: 12
 *       - in: query
 *         name: discountType
 *         schema:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *           example: PERCENTAGE
 *       - in: query
 *         name: showDraft
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           example: "6a9d..."
 *       - in: query
 *         name: tagIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             example: "6a9d..."
 *       - in: query
 *         name: creationDate
 *         schema:
 *           type: string
 *           enum: [NEWEST, OLDEST]
 *           example: NEWEST
 *       - in: query
 *         name: stockStatus
 *         schema:
 *           type: string
 *           enum: [IN_STOCK, LOW_STOCK, OUT_OF_STOCK]
 *           example: IN_STOCK
 *       - in: query
 *         name: meta[page]
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: meta[limit]
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Products fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetProductsResponseSchema'
 */
productRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  getProducts,
);

/**
 * @openapi
 * /products/delete:
 *   delete:
 *     summary: Deletes a product
 *     description: Deletes a product (soft delete) and decrements the associated category's usage count, and tags' usage count.
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteProductRequestSchema'
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 */
productRouter.delete(
  "/delete",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  DeleteProductValidator,
  deleteProduct,
);

/**
 * @openapi
 * /products/delete/bulk:
 *   delete:
 *     summary: Deletes multiple products
 *     description: Deletes multiple products (soft delete) and decrements the associated category's chlidren count, and tags' usage count.
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkDeleteProductsRequestSchema'
 *     responses:
 *       200:
 *         description: Products deleted successfully.
 */
productRouter.delete(
  "/delete/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.products, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  BulkDeleteProductsValidator,
  deleteBulkProducts,
);

/**
 * @openapi
 * /products/create:
 *   post:
 *     summary: Creates a product
 *     description: Creates a product and increments the associated category's usage count, and tags' usage count.
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequestSchema'
 *     responses:
 *       200:
 *         description: Product created successfully.
 */
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

/**
 * @openapi
 * /products/update:
 *   patch:
 *     summary: Updates a product
 *     description: Updates a product and increments/decrements the associated category's usage count, and tags' usage count.
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequestSchema'
 *     responses:
 *       200:
 *         description: Product updated successfully.
 */
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

/**
 * @openapi
 * /products/manage-status/bulk:
 *   patch:
 *     summary: Manages multiple products status
 *     description: Manages multiple products status.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkManageProductsStatusRequestSchema'
 *     responses:
 *       200:
 *         description: Managed products status successfully.
 */
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

/**
 * @openapi
 * /products/manage-stock:
 *   patch:
 *     summary: Manages a product stock
 *     description: Manages a product stock, increments or decrements it.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManageProductStockRequestSchema'
 *     responses:
 *       200:
 *         description: Managed product stock successfully.
 */
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
