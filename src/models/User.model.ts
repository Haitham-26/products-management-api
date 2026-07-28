import mongoose, { model, Types } from "mongoose";
import { SignUpMethods } from "../types/auth/shared/SignUpMethods";
import { UserRoles } from "../types/user/types/UserRoles.enum";
import { UserPermissions } from "../types/user/types/UserPermissions";
import { SchemaTypes } from "../types/shared/types/SchemaTypes";

export interface User extends mongoose.Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  company?: string;
  emailVerified: boolean;
  password?: string;
  signUpMethod: SignUpMethods;
  avatar?: string;
  avatarPublicId?: string;
  optCode?: {
    code: string;
    createdAt: Date;
  };
  roles: UserRoles[];
  organizationId?: Types.ObjectId;
  permissions?: UserPermissions;
  tokenVersion: number;
  forgotPasswordCode?: {
    code: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<User>(
  {
    name: {
      type: SchemaTypes.String,
      required: [true, "The name is required."],
      trim: true,
    },
    company: {
      type: SchemaTypes.String,
      trim: true,
    },
    email: {
      type: SchemaTypes.String,
      required: [true, "The email is required."],
      unique: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: SchemaTypes.String,
    },
    avatarPublicId: {
      type: SchemaTypes.String,
    },
    password: {
      type: SchemaTypes.String,
    },
    emailVerified: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    signUpMethod: {
      type: SchemaTypes.String,
      enum: SignUpMethods,
    },
    optCode: {
      code: {
        type: SchemaTypes.String,
      },
      createdAt: {
        type: SchemaTypes.Date,
      },
    },
    tokenVersion: {
      type: SchemaTypes.Number,
      default: 0,
    },
    roles: {
      type: [SchemaTypes.String],
      enum: UserRoles,
      default: [],
    },
    organizationId: {
      type: SchemaTypes.ObjectId,
      index: true,
    },
    permissions: {
      type: SchemaTypes.Map,
      of: {
        type: SchemaTypes.Map,
        of: SchemaTypes.Boolean,
      },
    },
    forgotPasswordCode: {
      code: {
        type: SchemaTypes.String,
      },
      createdAt: {
        type: SchemaTypes.Date,
      },
    },
  },
  { timestamps: true },
);

const UserModel = model("User", UserSchema);

export default UserModel;
