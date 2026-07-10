import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UpdateSettingsValidator } from "../validators/settings/update-settings.validator";
import { NonOrgMemberMiddleware } from "../middlewares/NonOrgMemberMiddleware";
import { OrgScopeMiddleware } from "../middlewares/OrgScopeMiddleware";

const settingsRouter = express.Router();

/**
 * @openapi
 * /settings/:
 *   get:
 *     summary: Gets user's settings
 *     description: Gets user's settings.
 *     tags:
 *       - Settings
 *     responses:
 *       200:
 *         description: Settings fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SettingsSchema'
 */
settingsRouter.get("/", AuthMiddleware, OrgScopeMiddleware, getSettings);

/**
 * @openapi
 * /settings/update:
 *   patch:
 *     summary: Updates user's settings
 *     description: Updates user's settings.
 *     tags:
 *       - Settings
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequestSchema'
 *     responses:
 *       200:
 *         description: Settings updated successfully.
 */
settingsRouter.patch(
  "/update",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  UpdateSettingsValidator,
  updateSettings,
);

export default settingsRouter;
