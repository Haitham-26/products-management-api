import mongoose, { model, Types } from "mongoose";
import { codes as currencyCodes } from "currency-codes";
import { AppLangs } from "../types/settings/types/AppLangs.enum";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface Settings extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  inventory: {
    defaultMinStock: number;
  };
  currency: string;
  lang: AppLangs;
  timeZone?: string;
  createdAt: string;
  updatedAt: string;
}

const SettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      required: [true, "The userId is required."],
      index: true,
      unique: true,
    },
    inventory: {
      defaultMinStock: {
        type: SchemaTypes.Number,
        default: 10,
        min: [1, "Default minimum stock must be at least 1."],
      },
    },
    currency: {
      type: SchemaTypes.String,
      enum: currencyCodes(),
      default: "USD",
    },
    lang: {
      type: SchemaTypes.String,
      enum: Object.values(AppLangs),
      default: AppLangs.EN,
    },
    timeZone: {
      type: SchemaTypes.String,
      default: "UTC",
    },
  },
  {
    timestamps: true,
  },
);

const SettingsModel = model("Settings", SettingsSchema);

export default SettingsModel;
