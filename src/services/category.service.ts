import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createCategory,
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

categoryRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.categories, [
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  getCategories,
);
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

export default categoryRouter;
