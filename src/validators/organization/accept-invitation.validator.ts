import { RequestHandler } from "express";
import { RequestContext } from "../../utils/RequestContext";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { User } from "../../models/User.model";
import MemberInvitationModel from "../../models/Member-invitation.model";
import { InvitationStatus } from "../../types/users-permissions/types/InvitationStatus.enum";
import { Types } from "mongoose";
import { errorHandler } from "../../errors/errorHandler";
import z from "zod";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.organization.acceptInvitation;

const acceptInvitationSchema = z.object({
  invitationId: z
    .string(TRANSLATION_KEY_PREFIX.invalidId)
    .refine((val) => Types.ObjectId.isValid(val), {
      message: TRANSLATION_KEY_PREFIX.invalidId,
    }),
});

export const AcceptInvitationValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = acceptInvitationSchema.parse(req.body);
    req.body = body;

    const { user } = RequestContext<{ user: User }>(req);

    const { invitationId } = req.body;

    const invitation = await MemberInvitationModel.findOne({
      _id: new Types.ObjectId(invitationId as string),
      inviteeEmail: user.email,
    });

    if (!invitation) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.notFound,
      });
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.notPending,
      });
    }

    const EXPIRES_IN = 30 * 24 * 60 * 60 * 1000;

    const isExpired =
      new Date(invitation.sentAt).getTime() + EXPIRES_IN < Date.now();

    if (isExpired) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.expired,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
