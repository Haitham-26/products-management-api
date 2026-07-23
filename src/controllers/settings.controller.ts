import express from "express";
import { RequestContext } from "../utils/RequestContext";
import SettingsModel, { Settings } from "../models/Settings.model";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { UpdateQuery } from "mongoose";
import { errorHandler } from "../errors/errorHandler";

const updateSettings = async (req: express.Request, res: express.Response) => {
  try {
    const { inventory, currency, lang, timeZone } = req.body;

    const { userId } = RequestContext<{ userId: string }>(req);

    const updateQuery: UpdateQuery<Settings> = {
      inventory,
      currency,
      lang,
      timeZone,
    };

    await SettingsModel.updateOne(
      { userId },
      {
        $set: updateQuery,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const getSettings = async (req: express.Request, res: express.Response) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const settings = await SettingsModel.findOne({ userId: scopeId });

    res.status(StatusCode.OK).json(settings);
  } catch (e) {
    errorHandler(e, res);
  }
};

export { updateSettings, getSettings };
