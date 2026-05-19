import mongoose from "mongoose";
import { CounterModel } from "../models/Counter.model";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";
import { RequestContext } from "../utils/RequestContext";
import express from "express";

export const generateIdentifier = async (
  req: express.Request,
  key: CounterKeys,
  session?: mongoose.ClientSession,
): Promise<string> => {
  const { userId } = RequestContext<{ userId: string }>(req);

  const counter = await CounterModel.findOneAndUpdate(
    { key, userId },
    { $inc: { seq: 1 }, $setOnInsert: { userId } },
    {
      new: true,
      upsert: true,
      session,
    },
  );

  return `${key}-${String(counter.seq).padStart(4, "0")}`;
};
