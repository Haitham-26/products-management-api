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
import { UserPermissionsMiddleware } from "../middlewares/UserPermissionsMiddleware";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";

const tagRouter = express.Router();

tagRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [CRUDPermissions.READ]),
  OrgScopeMiddleware,
  getTags,
);
tagRouter.delete(
  "/:id/delete",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  DeleteTagValidator,
  deleteTag,
);
tagRouter.post(
  "/create",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [
    CRUDPermissions.CREATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  CreateTagValidator,
  createTag,
);
tagRouter.patch(
  "/:id/update",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  UpdateTagValidator,
  updateTag,
);

export default tagRouter;
