import { CRUDPermissions } from "../../../types/user/types/CRUDPermissions.enum";
import { PermissionEntities } from "../../../types/user/types/PermissionEntities.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const UserPermissionsSchema = {
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
};

export default UserPermissionsSchema;
