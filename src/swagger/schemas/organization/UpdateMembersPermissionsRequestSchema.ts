import { CRUDPermissions } from "../../../types/user/types/CRUDPermissions.enum";
import { PermissionEntities } from "../../../types/user/types/PermissionEntities.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";
import UserPermissionsSchema from "../shared/UserPermissionsSchema";

const userPermissionsExample = Object.fromEntries(
  Object.values(PermissionEntities).map((entity) => [
    entity,
    Object.fromEntries(
      Object.values(CRUDPermissions).map((permission) => [permission, true]),
    ),
  ]),
);

const UpdateMembersPermissionsRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["members"],
  properties: {
    members: {
      type: SwaggerTypes.OBJECT,
      additionalProperties: {
        $ref: "#/components/schemas/UserPermissionsSchema",
      },
      example: {
        "6a9d...": userPermissionsExample,
      },
    },
  },
};

export default UpdateMembersPermissionsRequestSchema;
