import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../utils/RequestContext";
import { User } from "../models/User.model";
import { UserRoles } from "../types/user/types/UserRoles.enum";

/**
 * @description Middleware that checks if the user is a member of an organization
 * and sets the userId as the organizationId in the request context to be used in the db queries
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

    if (isMember) {
      RequestContext(req, { userId: user.organizationId });
    }

    next();
  } catch (e) {
    console.error("Something went wrong", e);
    res.status(StatusCode.INTERNAL_ERROR).send("Something went wrong");
    return;
  }
};
