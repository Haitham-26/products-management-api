import { Document, model, Schema, Types } from "mongoose";
import { InvitationStatus } from "../types/users-permissions/types/InvitationStatus.enum";
import { User } from "./User.model";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface MemberInvitation extends Document {
  _id: Types.ObjectId;
  inviter: Partial<User>;
  inviterId: Types.ObjectId;
  inviteeEmail: string;
  status: InvitationStatus;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberInvitationSchema = new Schema(
  {
    inviterId: {
      type: SchemaTypes.ObjectId,
      ref: "User",
      required: [true, "The inviter id is required."],
      index: true,
    },
    inviteeEmail: {
      type: SchemaTypes.String,
      required: [true, "The invitee email is required."],
      index: true,
    },
    status: {
      type: SchemaTypes.String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
    },
    sentAt: {
      type: SchemaTypes.Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

MemberInvitationSchema.virtual("inviter", {
  ref: "User",
  localField: "inviterId",
  foreignField: "_id",
  justOne: true,
});

// Auto delete after 30 days
MemberInvitationSchema.index(
  { sentAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

const MemberInvitationModel = model("MemberInvitation", MemberInvitationSchema);

export default MemberInvitationModel;
