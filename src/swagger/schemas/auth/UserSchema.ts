import { SignUpMethods } from "../../../types/auth/shared/SignUpMethods";
import { CRUDPermissions } from "../../../types/user/types/CRUDPermissions.enum";
import { PermissionEntities } from "../../../types/user/types/PermissionEntities.enum";
import { UserRoles } from "../../../types/user/types/UserRoles.enum";
import { SwaggerTypes } from "../../types/SwggaerTypes";

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
    password: {
      type: SwaggerTypes.STRING,
      example: "password123",
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
    optCode: {
      type: SwaggerTypes.STRING,
      example: "123456",
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
    permissions: {
      type: SwaggerTypes.OBJECT,
      properties: Object.fromEntries(
        Object.values(PermissionEntities).map((entity) => [
          entity,
          {
            type: SwaggerTypes.OBJECT,
            properties: Object.fromEntries(
              Object.values(CRUDPermissions).map((permission) => [
                permission,
                {
                  type: SwaggerTypes.BOOLEAN,
                  example: true,
                },
              ]),
            ),
          },
        ]),
      ),
    },
    tokenVersion: {
      type: SwaggerTypes.INTEGER,
      example: 1,
    },
    forgotPasswordCode: {
      type: SwaggerTypes.OBJECT,
      properties: {
        code: {
          type: SwaggerTypes.STRING,
          example: "123456",
        },
        createdAt: {
          type: SwaggerTypes.STRING,
          format: "date-time",
        },
      },
    },
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
