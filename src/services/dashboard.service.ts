import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";

const dashboardRouter = express.Router();

/**
 * @openapi
 * /dashboard/:
 *   get:
 *     summary: Gets dashboard stats
 *     description: Gets dashboard stats.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetDashboardStatsResponseSchema'
 */
dashboardRouter.get("/", AuthMiddleware, OrgScopeMiddleware, getDashboardStats);

export default dashboardRouter;
