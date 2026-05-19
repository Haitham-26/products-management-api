import mongoose, { model, Types } from "mongoose";
import { codes as currencyCodes } from "currency-codes";

export interface Settings extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  inventory: {
    defaultMinStock: number;
  };
  currency: string;
  createdAt: string;
  updatedAt: string;
}

const SettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: [true, "The userId is required."],
      index: true,
      unique: true,
    },
    inventory: {
      defaultMinStock: {
        type: Number,
        default: 10,
        min: [1, "Default minimum stock must be at least 1."],
      },
    },
    currency: {
      type: String,
      enum: currencyCodes(),
      default: "USD",
    },
  },
  {
    timestamps: true,
  },
);

const SettingsModel = model("Settings", SettingsSchema);

export default SettingsModel;
