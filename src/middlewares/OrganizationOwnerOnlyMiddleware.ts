import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../utils/RequestContext";
import { User } from "../models/User.model";
import { UserRoles } from "../types/user/types/UserRoles.enum";

export const OrganizationOwnerOnlyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const isOwner = user.roles.includes(UserRoles.OWNER);

    if (!isOwner) {
      res
        .status(StatusCode.FORBIDDEN)
        .send("Only organization owner can take this action");
      return;
    }

    next();
  } catch (e) {
    console.error("Something went wrong", e);
    res.status(StatusCode.INTERNAL_ERROR).send("Something went wrong");
    return;
  }
};
