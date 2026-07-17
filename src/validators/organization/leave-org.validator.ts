import { RequestHandler } from "express";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { RequestContext } from "../../utils/RequestContext";
import { User } from "../../models/User.model";
import { UserRoles } from "../../types/user/types/UserRoles.enum";
import { Types } from "mongoose";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { APIError } from "../../errors/APIError";

export const LeaveOrgValidator: RequestHandler = async (req, res, next) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const isMember =
      user.roles.includes(UserRoles.MEMBER) ||
      Types.ObjectId.isValid(user.organizationId as Types.ObjectId);

    if (!isMember) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: APIErrorKeys.organization.leave.notMember,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
