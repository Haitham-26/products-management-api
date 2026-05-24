import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { getDashboardStats } from "../controllers/dashboard.controller";

const dashboardRouter = express.Router();

dashboardRouter.post("/", AuthMiddleware, getDashboardStats);

export default dashboardRouter;
