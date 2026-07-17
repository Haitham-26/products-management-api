import { RequestContext } from "../../utils/RequestContext";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import z from "zod";
import UserModel, { User } from "../../models/User.model";
import { UserRoles } from "../../types/user/types/UserRoles.enum";
import MemberInvitationModel from "../../models/Member-invitation.model";
import { InvitationStatus } from "../../types/users-permissions/types/InvitationStatus.enum";
import { RequestHandler } from "express";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.organization.inviteMembers;

const inviteMembersSchema = z
  .object({
    emails: z
      .array(z.email(TRANSLATION_KEY_PREFIX.emails.invalid))
      .min(1, TRANSLATION_KEY_PREFIX.emails.minLength)
      .refine((emails) => new Set(emails).size === emails.length, {
        message: TRANSLATION_KEY_PREFIX.emails.duplicate,
      }),
  })
  .loose();

export const InviteMembersValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const body = inviteMembersSchema.parse(req.body);
    req.body = body;

    const { emails } = req.body;

    if (emails.includes(user.email)) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.selfInvite,
      });
    }

    const [usersInOrgs, existingPendingInvitations] = await Promise.all([
      UserModel.find({
        email: { $in: emails },
        $or: [
          { roles: { $in: [UserRoles.OWNER] } },
          { organizationId: { $exists: true } },
        ],
      }),
      MemberInvitationModel.find({
        inviteeEmail: { $in: emails },
        inviterId: user._id,
        status: InvitationStatus.PENDING,
      }),
    ]);

    if (usersInOrgs.length) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.invitees.someInOrg,
        params: { emails: usersInOrgs.map((user) => user.email).join(", ") },
      });
    }

    if (existingPendingInvitations.length) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.invitees.someHavePending,
        params: {
          emails: existingPendingInvitations
            .map((invitation) => invitation.inviteeEmail)
            .join(", "),
        },
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
