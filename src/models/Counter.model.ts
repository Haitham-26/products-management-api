import mongoose, { Schema, Document } from "mongoose";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";

export interface Counter extends Document {
  key: CounterKeys;
  userId: Schema.Types.ObjectId;
  seq: number;
}

const CounterSchema = new Schema<Counter>({
  key: {
    type: String,
    required: true,
    enum: Object.values(CounterKeys),
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  seq: { type: Number, default: 0, min: [0, "Sequence must be at least 0."] },
});

export const CounterModel = mongoose.model<Counter>("Counter", CounterSchema);
