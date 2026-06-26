import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
} from "../controllers/tag.controller";
import { UpdateTagValidator } from "../validators/tag/update-tag.validator";
import { CreateTagValidator } from "../validators/tag/create-tag.validator";
import { DeleteTagValidator } from "../validators/tag/delete-tag.validator";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";

const tagRouter = express.Router();

tagRouter.get("/", AuthMiddleware, OrgScopeMiddleware, getTags);
tagRouter.delete(
  "/:id/delete",
  AuthMiddleware,
  OrgScopeMiddleware,
  DeleteTagValidator,
  deleteTag,
);
tagRouter.post(
  "/create",
  AuthMiddleware,
  OrgScopeMiddleware,
  CreateTagValidator,
  createTag,
);
tagRouter.patch(
  "/:id/update",
  AuthMiddleware,
  OrgScopeMiddleware,
  UpdateTagValidator,
  updateTag,
);

export default tagRouter;
