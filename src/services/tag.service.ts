import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createTag,
  deleteBulkTags,
  deleteTag,
  getTags,
  updateTag,
} from "../controllers/tag.controller";
import { UpdateTagValidator } from "../validators/tag/update-tag.validator";
import { CreateTagValidator } from "../validators/tag/create-tag.validator";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";
import { UserPermissionsMiddleware } from "../middlewares/UserPermissionsMiddleware";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { BulkDeleteTagsValidator } from "../validators/tag/bulk-delete-tags.validator";
import { DeleteTagValidator } from "../validators/tag/delete-tag.validator";

const tagRouter = express.Router();

/**
 * @openapi
 * /tags/:
 *   get:
 *     summary: Get all user's tags
 *     description: Returns all user's tags paginated, sorted and filtered.
 *     tags:
 *       - Tags
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
 *         description: Tags fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetTagsResponseSchema'
 */
tagRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [CRUDPermissions.READ]),
  OrgScopeMiddleware,
  getTags,
);

/**
 * @openapi
 * /tags/create:
 *   post:
 *     summary: Creates a new tag
 *     description: Creates a new tag.
 *     tags:
 *       - Tags
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTagRequestSchema'
 *     responses:
 *       200:
 *         description: Tag created successfully.
 */
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

/**
 * @openapi
 * /tags/update:
 *   patch:
 *     summary: Updates a tag
 *     description: Updates a tag.
 *     tags:
 *       - Tags
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTagRequestSchema'
 *     responses:
 *       200:
 *         description: Tag updated successfully.
 */
tagRouter.patch(
  "/update",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  UpdateTagValidator,
  updateTag,
);

/**
 * @openapi
 * /tags/delete:
 *   delete:
 *     summary: Deletes a tag
 *     description: Deletes a tag (if it has no products, soft delete, otherwise hard delete) and unsets all products under it.
 *     tags:
 *       - Tags
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteTagRequestSchema'
 *     responses:
 *       200:
 *         description: Tag deleted successfully.
 */
tagRouter.delete(
  "/delete",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  DeleteTagValidator,
  deleteTag,
);

/**
 * @openapi
 * /tags/delete/bulk:
 *   delete:
 *     summary: Deletes multiple tags
 *     description: Deletes multiple tags (if they're not used, hard delete, otherwise soft delete) and unsets all products under them.
 *     tags:
 *       - Tags
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkDeleteTagsRequestSchema'
 *     responses:
 *       200:
 *         description: Tags deleted successfully.
 */
tagRouter.delete(
  "/delete/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.tags, [
    CRUDPermissions.DELETE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  BulkDeleteTagsValidator,
  deleteBulkTags,
);

export default tagRouter;
