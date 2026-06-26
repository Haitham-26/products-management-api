import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";

const dashboardRouter = express.Router();

dashboardRouter.post(
  "/",
  AuthMiddleware,
  OrgScopeMiddleware,
  getDashboardStats,
);

export default dashboardRouter;
