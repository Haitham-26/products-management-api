import mongoose from "mongoose";
import { CounterModel } from "../models/Counter.model";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";

export const getNextSequence = async (
  key: CounterKeys,
  session?: mongoose.ClientSession,
): Promise<number> => {
  const counter = await CounterModel.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      session,
    },
  );

  return counter.seq;
};
