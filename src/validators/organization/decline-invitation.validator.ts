import { RequestHandler } from "express";
import { RequestContext } from "../../utils/RequestContext";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { User } from "../../models/User.model";
import MemberInvitationModel from "../../models/Member-invitation.model";
import { InvitationStatus } from "../../types/users-permissions/types/InvitationStatus.enum";
import { Types } from "mongoose";
import { errorHandler } from "../../errors/errorHandler";

export const DeclineInvitationValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const { invitationId } = req.body;

    if (!Types.ObjectId.isValid(invitationId)) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Invalid invitation id",
      });
      return;
    }

    const invitation = await MemberInvitationModel.findOne({
      _id: new Types.ObjectId(invitationId as string),
      inviteeEmail: user.email,
    });

    if (!invitation) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Invitation not found",
      });
      return;
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Cannot decline an invitation that is not pending",
      });
      return;
    }

    const EXPIRES_IN = 30 * 24 * 60 * 60 * 1000;

    const isExpired =
      new Date(invitation.createdAt).getTime() + EXPIRES_IN < Date.now();

    if (isExpired) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Invitation has expired",
      });
      return;
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
