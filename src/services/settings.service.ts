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

settingsRouter.patch(
  "/update",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  UpdateSettingsValidator,
  updateSettings,
);

settingsRouter.post("/", AuthMiddleware, OrgScopeMiddleware, getSettings);

export default settingsRouter;
