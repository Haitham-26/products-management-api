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

const categoryRouter = express.Router();

/**
 * @openapi
 * /categories/:
 *   get:
 *     summary: Get all user's categories
 *     description: Returns all user's categories paginated, sorted and filtered.
 *     tags:
 *       - Categories
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetCategoriesRequestSchema'
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
 *             $ref: '#/components/schemas/BulkDeleteCategoryRequestSchema'
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
  deleteBulkCategories,
);

export default categoryRouter;
