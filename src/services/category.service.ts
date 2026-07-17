import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createCategory,
  deleteBulkCategories,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller";
import { CreateCategoryValidator } from "../validators/category/create-category.validator";
import { UpdateCategoryValidator } from "../validators/category/update-category.validator";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";
import { UserPermissionsMiddleware } from "../middlewares/UserPermissionsMiddleware";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { DeleteCategoryValidator } from "../validators/category/delete-category.validator";
import { BulkDeleteCategoriesValidator } from "../validators/category/bulk-delete-categories.validator";

const categoryRouter = express.Router();

/**
 * @openapi
 * /categories/:
 *   get:
 *     summary: Get all user's categories
 *     description: Returns all user's categories paginated, sorted and filtered.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "premium"
 *       - in: query
 *         name: minUsageCount
 *         schema:
 *           type: integer
 *           example: 5
 *       - in: query
 *         name: maxUsageCount
 *         schema:
 *           type: integer
 *           example: 12
 *       - in: query
 *         name: creationDate
 *         schema:
 *           type: string
 *           enum: [NEWEST, OLDEST]
 *           example: NEWEST
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
 *         description: Categories fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetCategoriesResponseSchema'
 */
categoryRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.categories, [
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  getCategories,
);

/**
 * @openapi
 * /categories/create:
 *   post:
 *     summary: Creates a new category
 *     description: Creates a new category.
 *     tags:
 *       - Categories
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequestSchema'
 *     responses:
 *       200:
 *         description: Category created successfully.
 */
categoryRouter.post(
  "/create",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.categories, [
    CRUDPermissions.READ,
    CRUDPermissions.CREATE,
  ]),
  OrgScopeMiddleware,
  CreateCategoryValidator,
  createCategory,
);

/**
 * @openapi
 * /categories/update:
 *   patch:
 *     summary: Updates a category
 *     description: Updates a category.
 *     tags:
 *       - Categories
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequestSchema'
 *     responses:
 *       200:
 *         description: Category updated successfully.
 */
categoryRouter.patch(
  "/update",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.categories, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  UpdateCategoryValidator,
  updateCategory,
);

/**
 * @openapi
 * /categories/delete:
 *   delete:
 *     summary: Deletes a category
 *     description: Deletes a category (soft delete) and unsets all products under it.
 *     tags:
 *       - Categories
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteCategoryRequestSchema'
 *     responses:
 *       200:
 *         description: Category deleted successfully.
 */
categoryRouter.delete(
  "/delete",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.categories, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  DeleteCategoryValidator,
  deleteCategory,
);

/**
 * @openapi
 * /categories/delete/bulk:
 *   delete:
 *     summary: Deletes multiple categories
 *     description: Deletes multiple categories (soft delete) and unsets all products under them.
 *     tags:
 *       - Categories
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkDeleteCategoriesRequestSchema'
 *     responses:
 *       200:
 *         description: Categories deleted successfully.
 */
categoryRouter.delete(
  "/delete/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.categories, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  BulkDeleteCategoriesValidator,
  deleteBulkCategories,
);

export default categoryRouter;
