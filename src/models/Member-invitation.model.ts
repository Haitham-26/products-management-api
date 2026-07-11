import mongoose, { model, Types } from "mongoose";
import { InvitationStatus } from "../types/users-permissions/types/InvitationStatus.enum";
import { User } from "./User.model";

export interface MemberInvitation extends mongoose.Document {
  _id: Types.ObjectId;
  inviter: Partial<User>;
  inviterId: Types.ObjectId;
  inviteeEmail: string;
  status: InvitationStatus;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberInvitationSchema = new mongoose.Schema(
  {
    inviterId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "The inviter id is required."],
      index: true,
    },
    inviteeEmail: {
      type: String,
      required: [true, "The invitee email is required."],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
    },
    sentAt: {
      type: Date,
      default: Date.now(),
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
