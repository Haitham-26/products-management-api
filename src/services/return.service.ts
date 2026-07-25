import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UserPermissionsMiddleware } from "../middlewares/UserPermissionsMiddleware";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";
import {
  createReturn,
  getReturns,
  updateReturn,
} from "../controllers/return.controller";
import { CreateReturnValidator } from "../validators/return/create-return.validator";
import { UpdateReturnValidator } from "../validators/return/update-return.validator";

const returnRouter = express.Router();

/**
 * @openapi
 * /returns/:
 *   get:
 *     summary: "Gets user's returns."
 *     description: "Returns all user's returns paginated, sorted and filtered."
 *     tags:
 *       - Returns
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "ORD-0001"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, VOIDED]
 *           example: COMPLETED
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [NEWEST, OLDEST]
 *           example: NEWEST
 *       - in: query
 *         name: datePeriod
 *         schema:
 *           type: string
 *           enum: [TODAY, THIS_WEEK, THIS_MONTH]
 *           example: TODAY
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
 *         description: "Returns fetched successfully."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetReturnsResponseSchema'
 */
returnRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.returns, [CRUDPermissions.READ]),
  OrgScopeMiddleware,
  getReturns,
);

/**
 * @openapi
 * /returns/create:
 *   post:
 *     summary: Creates a new return
 *     description: Creates a new return.
 *     tags:
 *       - Returns
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReturnRequestSchema'
 *     responses:
 *       200:
 *         description: Return created successfully.
 */
returnRouter.post(
  "/create",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.returns, [
    CRUDPermissions.CREATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  CreateReturnValidator,
  createReturn,
);

/**
 * @openapi
 * /returns/update:
 *   patch:
 *     summary: Updates a return
 *     description: Updates a return.
 *     tags:
 *       - Returns
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReturnRequestSchema'
 *     responses:
 *       200:
 *         description: Return updated successfully.
 */
returnRouter.patch(
  "/update",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.returns, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  UpdateReturnValidator,
  updateReturn,
);

export default returnRouter;
