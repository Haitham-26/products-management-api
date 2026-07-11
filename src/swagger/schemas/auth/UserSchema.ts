import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { UserRoles } from "../../../types/user/types/UserRoles.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";
import UserPermissionsSchema from "../shared/UserPermissionsSchema";

const UserSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    _id: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    name: {
      type: SwaggerTypes.STRING,
      example: "Haitham Waki",
    },
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
    company: {
      type: SwaggerTypes.STRING,
      example: "Inventix",
    },
    emailVerified: {
      type: SwaggerTypes.BOOLEAN,
      example: true,
    },
    signUpMethod: {
      type: SwaggerTypes.STRING,
      enum: Object.values(SignUpMethods),
      example: SignUpMethods.EMAIL,
    },
    avatar: {
      type: SwaggerTypes.STRING,
    },
    avatarPublicId: {
      type: SwaggerTypes.STRING,
    },
    roles: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: UserRoles.MEMBER,
      },
    },
    organizationId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    permissions: UserPermissionsSchema,
    createdAt: {
      type: SwaggerTypes.STRING,
      format: "date-time",
    },
    updatedAt: {
      type: SwaggerTypes.STRING,
      format: "date-time",
    },
  },
};

export default UserSchema;
