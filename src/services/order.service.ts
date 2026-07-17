import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  bulkManageOrderStatus,
  bulkManageOrderVisibility,
  createOrder,
  getOrders,
  manageOrderStatus,
  updateOrder,
} from "../controllers/order.controller";
import { CreateOrderValidator } from "../validators/order/create-order.validator";
import { UpdateOrderValidator } from "../validators/order/update-order.validator";
import { ManageOrderStatusValidator } from "../validators/order/manage-order-status.validator";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";
import { UserPermissionsMiddleware } from "../middlewares/UserPermissionsMiddleware";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { BulkManageOrderVisibilityValidator } from "../validators/order/bulk-manage-order-visibility.validator";
import { BulkManageOrderStatusValidator } from "../validators/order/bulk-manage-order-status.validator";

const orderRouter = express.Router();

/**
 * @openapi
 * /orders/:
 *   get:
 *     summary: Gets user's orders
 *     description: Returns all user's orders paginated, sorted and filtered.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "+90123456789"
 *       - in: query
 *         name: showArchived
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: minTotalPrice
 *         schema:
 *           type: integer
 *           example: 500
 *       - in: query
 *         name: maxTotalPrice
 *         schema:
 *           type: integer
 *           example: 2000
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, DELIVERED, CANCELED]
 *           example: PENDING
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
 *         description: Orders fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetOrdersResponseSchema'
 */
orderRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [CRUDPermissions.READ]),
  OrgScopeMiddleware,
  getOrders,
);

/**
 * @openapi
 * /orders/create:
 *   post:
 *     summary: Creates a new order
 *     description: Creates a new order.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequestSchema'
 *     responses:
 *       200:
 *         description: Order created successfully.
 */
orderRouter.post(
  "/create",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [
    CRUDPermissions.CREATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  CreateOrderValidator,
  createOrder,
);

/**
 * @openapi
 * /orders/update:
 *   patch:
 *     summary: Updates an order
 *     description: Updates an order.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderRequestSchema'
 *     responses:
 *       200:
 *         description: Order updated successfully.
 */
orderRouter.patch(
  "/update",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  UpdateOrderValidator,
  updateOrder,
);

/**
 * @openapi
 * /orders/manage-visibility/bulk:
 *   patch:
 *     summary: Manages multiple orders visibility
 *     description: Manages multiple orders visibility.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkManageOrdersVisibilityRequestSchema'
 *     responses:
 *       200:
 *         description: Managed orders visibility successfully.
 */
orderRouter.patch(
  "/manage-visibility/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  BulkManageOrderVisibilityValidator,
  bulkManageOrderVisibility,
);

/**
 * @openapi
 * /orders/manage-status:
 *   patch:
 *     summary: Manages order status
 *     description: Manages order status.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManageOrderStatusRequestSchema'
 *     responses:
 *       200:
 *         description: Managed order status successfully.
 */
orderRouter.patch(
  "/manage-status",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  ManageOrderStatusValidator,
  manageOrderStatus,
);

/**
 * @openapi
 * /orders/manage-status/bulk:
 *   patch:
 *     summary: Manages multiple orders status
 *     description: Manages multiple orders status.
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkManageOrdersStatusRequestSchema'
 *     responses:
 *       200:
 *         description: Managed orders status successfully.
 */
orderRouter.patch(
  "/manage-status/bulk",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  BulkManageOrderStatusValidator,
  bulkManageOrderStatus,
);

export default orderRouter;
