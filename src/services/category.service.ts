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

const categoryRouter = express.Router();

categoryRouter.get("/", AuthMiddleware, getCategories);
categoryRouter.post(
  "/create",
  AuthMiddleware,
  CreateCategoryValidator,
  createCategory,
);
categoryRouter.patch(
  "/update",
  AuthMiddleware,
  UpdateCategoryValidator,
  updateCategory,
);
categoryRouter.delete("/delete", AuthMiddleware, deleteCategory);

export default categoryRouter;
