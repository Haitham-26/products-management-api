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

const categoryRouter = express.Router();

categoryRouter.get("/", AuthMiddleware, OrgScopeMiddleware, getCategories);
categoryRouter.post(
  "/create",
  AuthMiddleware,
  OrgScopeMiddleware,
  CreateCategoryValidator,
  createCategory,
);
categoryRouter.patch(
  "/update",
  AuthMiddleware,
  OrgScopeMiddleware,
  UpdateCategoryValidator,
  updateCategory,
);
categoryRouter.delete(
  "/delete",
  AuthMiddleware,
  OrgScopeMiddleware,
  deleteCategory,
);

export default categoryRouter;
