import type { CRUDPermissions } from "./CRUDPermissions.enum";
import type { PermissionEntities } from "./PermissionEntities.enum";

export type UserPermissions = Map<
  PermissionEntities,
  Map<CRUDPermissions, boolean>
>;
