import express from "express";
import { RequestContext } from "../utils/RequestContext";
import SettingsModel, { Settings } from "../models/Settings.model";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { UpdateQuery } from "mongoose";

const updateSettings = async (req: express.Request, res: express.Response) => {
  try {
    const { inventory } = req.body;

    const { userId } = RequestContext<{ userId: string }>(req);

    const updateQuery: UpdateQuery<Settings> = {
      inventory,
    };

    await SettingsModel.updateOne(
      { userId },
      {
        $set: updateQuery,
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getSettings = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const settings = await SettingsModel.findOne({ userId });

    res.status(StatusCode.OK).json(settings);
  } catch (e) {
    console.log(e);
  }
};

export { updateSettings, getSettings };
