import mongoose, { model, Types } from "mongoose";
import { SignUpMethods } from "../types/auth/shared/SignUpMethods";
import { UserRoles } from "../types/user/types/UserRoles.enum";

export interface User extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  signUpMethod: SignUpMethods;
  avatar?: string;
  optCode?: string;
  roles: UserRoles[];
  organizationId?: string;
  forgotPasswordCode?: {
    code: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "The name is required."],
    },

    email: {
      type: String,
      required: [true, "The email is required."],
      unique: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    password: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    signUpMethod: {
      type: String,
      enum: SignUpMethods,
    },
    optCode: {
      type: String,
    },
    roles: {
      type: [String],
      enum: UserRoles,
      default: [],
    },
    organizationId: {
      type: Types.ObjectId,
    },
    forgotPasswordCode: {
      code: {
        type: String,
      },
      createdAt: {
        type: Date,
      },
    },
  },
  { timestamps: true },
);

const UserModel = model("User", UserSchema);

export default UserModel;
