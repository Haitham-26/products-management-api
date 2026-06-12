import mongoose, { model, Types } from "mongoose";

export interface MemberInvitation extends mongoose.Document {
  _id: Types.ObjectId;
  inviterId: Types.ObjectId;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const MemberInvitationSchema = new mongoose.Schema(
  {
    inviterId: {
      type: Types.ObjectId,
      required: [true, "The inviterId is required."],
      index: true,
    },
    email: {
      type: String,
      required: [true, "The email is required."],
    },
  },
  {
    timestamps: true,
  },
);

const MemberInvitationModel = model("MemberInvitation", MemberInvitationSchema);

export default MemberInvitationModel;
