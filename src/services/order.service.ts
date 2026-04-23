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

const orderRouter = express.Router();

orderRouter.get("/", AuthMiddleware, getOrders);
orderRouter.post("/create", AuthMiddleware, CreateOrderValidator, createOrder);
orderRouter.patch(
  "/:id/update",
  AuthMiddleware,
  UpdateOrderValidator,
  updateOrder,
);
orderRouter.patch(
  "/:id/manage-status",
  AuthMiddleware,
  ManageOrderStatusValidator,
  manageOrderStatus,
);

export default orderRouter;
