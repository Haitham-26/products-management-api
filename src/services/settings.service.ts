import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UpdateSettingsValidator } from "../validators/settings/update-settings.validator";

const settingsRouter = express.Router();

settingsRouter.patch(
  "/update",
  AuthMiddleware,
  UpdateSettingsValidator,
  updateSettings,
);

settingsRouter.post("/", AuthMiddleware, getSettings);

export default settingsRouter;
