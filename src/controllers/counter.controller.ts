import mongoose from "mongoose";
import { CounterModel } from "../models/Counter.model";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";
import { RequestContext } from "../utils/RequestContext";
import express from "express";

export const getNextSequence = async (
  req: express.Request,
  key: CounterKeys,
  session?: mongoose.ClientSession,
): Promise<number> => {
  const { userId } = RequestContext<{ userId: string }>(req);

  const counter = await CounterModel.findOneAndUpdate(
    { _id: key, userId },
    { $inc: { seq: 1 }, $setOnInsert: { userId } },
    {
      new: true,
      upsert: true,
      session,
    },
  );

  return counter.seq;
};
