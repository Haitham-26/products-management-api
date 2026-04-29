import mongoose, { Schema, Document } from "mongoose";

export interface Counter extends Document {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<Counter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel = mongoose.model<Counter>("Counter", CounterSchema);
