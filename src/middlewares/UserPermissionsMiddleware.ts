import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../utils/RequestContext";
import { User } from "../models/User.model";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { APIErrorKeys } from "../errors/APIError-keys";
import { APIError } from "../errors/APIError";
import { errorHandler } from "../errors/errorHandler";

export const UserPermissionsMiddleware = (
  entity: PermissionEntities,
  permissions: CRUDPermissions[],
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = RequestContext<{ user: User }>(req);

      // Owner / non-member bypass
      if (!user.organizationId) {
        next();
        return;
      }

      if (!user.permissions) {
        throw new APIError({
          status: StatusCode.FORBIDDEN,
          message: APIErrorKeys.permissions.orgOnly,
        });
      }

      const hasPermissions = permissions.every((permission) => {
        return user.permissions?.[entity][permission];
      });

      if (!hasPermissions) {
        throw new APIError({
          status: StatusCode.FORBIDDEN,
          message: APIErrorKeys.permissions.orgOnly,
        });
      }

      next();
    } catch (e) {
      errorHandler(e, res);
    }
  };
};
