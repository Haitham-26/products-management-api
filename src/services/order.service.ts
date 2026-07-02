import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
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
  "/:id/update",
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
  "/:id/manage-status",
  AuthMiddleware,
  UserPermissionsMiddleware(PermissionEntities.orders, [
    CRUDPermissions.UPDATE,
    CRUDPermissions.READ,
  ]),
  OrgScopeMiddleware,
  ManageOrderStatusValidator,
  manageOrderStatus,
);

export default orderRouter;
