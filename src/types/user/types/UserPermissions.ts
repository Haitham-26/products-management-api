import type { CRUDPermissions } from "./CRUDPermissions.enum";
import type { PermissionEntities } from "./PermissionEntities";

export type UserPermissions = {
  [entity in PermissionEntities]: {
    [action in CRUDPermissions]?: boolean;
  };
};
