import mongoose, { Schema, Document } from "mongoose";

export interface RefreshToken extends Document {
  userId: Schema.Types.ObjectId;
  hashedToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<RefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    hashedToken: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
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
