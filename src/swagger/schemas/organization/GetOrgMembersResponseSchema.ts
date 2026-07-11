import { UserRoles } from "../../../types/user/types/UserRoles.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";
import UserPermissionsSchema from "../shared/UserPermissionsSchema";

const GetOrgMembersResponseSchema = {
  type: SwaggerTypes.ARRAY,
  items: {
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
      company: {
        type: SwaggerTypes.STRING,
        example: "Inventix",
      },
      email: {
        type: SwaggerTypes.STRING,
        format: "email",
        example: "haitham@example.com",
      },
      avatar: {
        type: SwaggerTypes.STRING,
        format: "binary",
      },
      roles: {
        type: SwaggerTypes.ARRAY,
        items: {
          type: SwaggerTypes.STRING,
          enum: Object.values(UserRoles),
          example: UserRoles.OWNER,
        },
      },
      permissions: UserPermissionsSchema,
    },
  },
};

export default GetOrgMembersResponseSchema;
