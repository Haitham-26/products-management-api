import mongoose, { model, Types } from "mongoose";

export interface Settings extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  inventory: {
    defaultMinStock: number;
  };
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
  },
  {
    timestamps: true,
  },
);

const SettingsModel = model("Settings", SettingsSchema);

export default SettingsModel;
