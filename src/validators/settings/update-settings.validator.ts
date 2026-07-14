import { RequestHandler } from "express";
import { RequestContext } from "../../utils/RequestContext";
import SettingsModel from "../../models/Settings.model";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import z from "zod";
import currencyCodes from "currency-codes";
import { AppLangs } from "../../types/settings/types/AppLangs.enum";

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
    currency: z
      .string()
      .length(3)
      .refine((v) => currencyCodes.code(v), {
        message: "Unsupported currency code",
      })
      .optional(),
    lang: z
      .enum(Object.values(AppLangs), "Language is not supported")
      .optional(),
  })
  .loose();

export const UpdateSettingsValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
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
