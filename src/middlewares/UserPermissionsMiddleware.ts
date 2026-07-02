import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../utils/RequestContext";
import { User } from "../models/User.model";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";

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
        res.status(StatusCode.FORBIDDEN).send({
          message:
            "You do not have the required permissions to perform this action",
        });

        return;
      }

      const hasPermissions = permissions.every((permission) => {
        return user.permissions?.[entity][permission];
      });

      if (!hasPermissions) {
        res.status(StatusCode.FORBIDDEN).send({
          message:
            "You do not have the required permissions to perform this action",
        });

        return;
      }

      next();
    } catch (e) {
      console.error("UserPermissionsMiddleware error:", e);

      res.status(StatusCode.INTERNAL_ERROR).send({
        message: "Something went wrong",
      });
    }
  };
};
