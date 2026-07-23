import { Schema, Document, model, Types } from "mongoose";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface Counter extends Document {
  key: CounterKeys;
  userId: Types.ObjectId;
  seq: number;
}

const CounterSchema = new Schema<Counter>({
  key: {
    type: SchemaTypes.String,
    required: true,
    enum: Object.values(CounterKeys),
    index: true,
  },
  userId: {
    type: SchemaTypes.ObjectId,
    required: true,
    index: true,
  },
  seq: { type: Number, default: 0, min: [0, "Sequence must be at least 0."] },
});

export const CounterModel = model<Counter>("Counter", CounterSchema);
