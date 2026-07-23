import mongoose, { Schema, Document, Types } from "mongoose";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface RefreshToken extends Document {
  userId: Types.ObjectId;
  hashedToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<RefreshToken>(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      required: true,
      index: true,
    },
    hashedToken: {
      type: SchemaTypes.String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: SchemaTypes.Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model<RefreshToken>(
  "RefreshToken",
  RefreshTokenSchema,
);
