import { RequestHandler } from "express";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../utils/RequestContext";
import { User } from "../models/User.model";
import { UserRoles } from "../types/user/types/UserRoles.enum";
import { errorHandler } from "../errors/errorHandler";
import { ApiError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";

export const NonOrgMemberMiddleware: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const isMember = user.roles.includes(UserRoles.MEMBER);

    if (isMember) {
      throw new ApiError({
        status: StatusCode.FORBIDDEN,
        message: APIErrorKeys.permissions.orgOnly,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
