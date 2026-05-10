import express from "express";
import { RequestContext } from "../../utils/RequestContext";
import SettingsModel from "../../models/Settings.model";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import z from "zod";

const updateSettingsSchema = z
  .object({
    inventory: z
      .object({
        defaultMinStock: z
          .number()
          .min(1, "Default minimum stock must be at least 1.")
          .optional(),
      })
      .optional(),
  })
  .loose();

export const UpdateSettingsValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const settings = await SettingsModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!settings) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Settings not found" });
      return;
    }

    const body = updateSettingsSchema.parse(req.body);
    req.body = body;

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
