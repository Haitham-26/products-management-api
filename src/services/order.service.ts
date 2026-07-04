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

orderRouter.get(
  "/",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [CRUDPermissions.READ]),
  OrgScopeMiddleware,
  getOrders,
);
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
