import { RequestHandler } from "express";
import { RequestContext } from "../../utils/RequestContext";
import SettingsModel from "../../models/Settings.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import z from "zod";
import currencyCodes from "currency-codes";
import { AppLangs } from "../../types/settings/types/AppLangs.enum";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.settings.update;

const isValidTimeZone = (timeZone: string) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
};

const updateSettingsSchema = z
  .object({
    inventory: z
      .object({
        defaultMinStock: z
          .int(TRANSLATION_KEY_PREFIX.inventory.defaultMinStock.invalid)
          .min(1, TRANSLATION_KEY_PREFIX.inventory.defaultMinStock.min)
          .optional(),
      })
      .optional(),
    currency: z
      .string(TRANSLATION_KEY_PREFIX.currency.invalid)
      .refine((v) => currencyCodes.code(v), {
        message: TRANSLATION_KEY_PREFIX.currency.invalid,
      })
      .optional(),
    lang: z
      .enum(Object.values(AppLangs), TRANSLATION_KEY_PREFIX.lang.invalid)
      .optional(),
    timeZone: z
      .string(TRANSLATION_KEY_PREFIX.timeZone.invalid)
      .refine(isValidTimeZone, {
        message: TRANSLATION_KEY_PREFIX.timeZone.invalid,
      })
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

    const body = updateSettingsSchema.parse(req.body);
    req.body = body;

    const settings = await SettingsModel.findOne({
      userId,
    });

    if (!settings) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
