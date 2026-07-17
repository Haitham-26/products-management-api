import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../utils/RequestContext";
import { User } from "../models/User.model";
import { UserRoles } from "../types/user/types/UserRoles.enum";
import { errorHandler } from "../errors/errorHandler";

/**
 * @description Middleware that checks if the user is a member of an organization
 */
export const OrgScopeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const isMember =
      user.roles.includes(UserRoles.MEMBER) && user.organizationId;

    const scopeId = isMember ? user.organizationId : user._id;

    RequestContext(req, { scopeId });

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
