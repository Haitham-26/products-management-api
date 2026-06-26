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

const orderRouter = express.Router();

orderRouter.get("/", AuthMiddleware, OrgScopeMiddleware, getOrders);
orderRouter.post(
  "/create",
  AuthMiddleware,
  OrgScopeMiddleware,
  CreateOrderValidator,
  createOrder,
);
orderRouter.patch(
  "/:id/update",
  AuthMiddleware,
  OrgScopeMiddleware,
  UpdateOrderValidator,
  updateOrder,
);
orderRouter.patch(
  "/:id/manage-status",
  AuthMiddleware,
  OrgScopeMiddleware,
  ManageOrderStatusValidator,
  manageOrderStatus,
);

export default orderRouter;
