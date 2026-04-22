import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  createOrder,
  deleteOrder,
  getOrders,
  updateOrder,
} from "../controllers/order.controller";
import { CreateOrderValidator } from "../validators/order/create-order.validator";
import { UpdateOrderValidator } from "../validators/order/update-order.validator";

const orderRouter = express.Router();

orderRouter.get("/", AuthMiddleware, getOrders);
orderRouter.delete("/:id/delete", AuthMiddleware, deleteOrder);
orderRouter.post("/create", AuthMiddleware, CreateOrderValidator, createOrder);
orderRouter.patch(
  "/:id/update",
  AuthMiddleware,
  UpdateOrderValidator,
  updateOrder,
);

export default orderRouter;
