import express, { RequestHandler } from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import MemberInvitationModel from "../models/Member-invitation.model";
import { sendMemberInvitationEmail } from "../mailer";
import UserModel, { User } from "../models/User.model";
import { InvitationStatus } from "../types/users-permissions/types/InvitationStatus.enum";
import { Types } from "mongoose";
import { UserRoles } from "../types/user/types/UserRoles.enum";
import { CRUDPermissions } from "../types/user/types/CRUDPermissions.enum";
import { withTransaction } from "../utils/withTransaction";
import { PermissionEntities } from "../types/user/types/PermissionEntities.enum";
import SettingsModel from "../models/Settings.model";
import { AppLangs } from "../types/settings/types/AppLangs.enum";
import { errorHandler } from "../errors/errorHandler";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";

const getOwnerInvitations: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const invitations = await MemberInvitationModel.find({
      inviterId: user._id,
    }).sort({ createdAt: -1 });

    res.status(StatusCode.OK).json({ invitations });
  } catch (e) {
    errorHandler(e, res);
  }
};

const getJoinOrgInvitations: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const invitations = await MemberInvitationModel.aggregate([
      {
        $match: {
          inviteeEmail: user.email,
          status: InvitationStatus.PENDING,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { inviterId: "$inviterId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$inviterId"] } } },
            { $project: { _id: 0, name: 1, company: 1 } },
          ],
          as: "inviter",
        },
      },
      {
        $unwind: {
          path: "$inviter",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          inviter: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    res.status(StatusCode.OK).json({ invitations });
  } catch (e) {
    errorHandler(e, res);
  }
};

const inviteMembers: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const settings = await SettingsModel.findOne(
      { userId: user._id },
      {
        lang: 1,
      },
    );

    const { emails } = req.body;

    await MemberInvitationModel.bulkWrite(
      (emails as string[]).map((email) => ({
        updateOne: {
          filter: {
            inviteeEmail: email,
            status: {
              $in: [InvitationStatus.DECLINED, InvitationStatus.CANCELED],
            },
            inviterId: user._id,
          },
          update: {
            $set: { status: InvitationStatus.PENDING, sentAt: Date.now() },
            $setOnInsert: {
              inviterId: user._id,
              inviteeEmail: email,
            },
          },
          upsert: true,
        },
      })),
    );

    const lang = settings?.lang || AppLangs.EN;
    const dir = lang === AppLangs.AR ? "rtl" : "ltr";

    await Promise.allSettled(
      emails.map((email: string) =>
        sendMemberInvitationEmail(email, user?.company || user.name, lang, dir),
      ),
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const cancelInvitation: RequestHandler = async (req, res) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { invitationId } = req.body;

    await MemberInvitationModel.updateOne(
      {
        _id: new Types.ObjectId(invitationId as string),
        inviterId: userId,
      },
      {
        $set: {
          status: InvitationStatus.CANCELED,
        },
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const declineInvitation: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const { invitationId } = req.body;

    await MemberInvitationModel.updateOne(
      {
        _id: new Types.ObjectId(invitationId as string),
        inviteeEmail: user.email,
      },
      {
        $set: {
          status: InvitationStatus.DECLINED,
        },
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const acceptInvitation: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const { invitationId } = req.body;

    await withTransaction(async (session) => {
      const invitation = await MemberInvitationModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(invitationId as string),
          inviteeEmail: user.email,
          status: InvitationStatus.PENDING,
        },
        {
          $set: {
            status: InvitationStatus.ACCEPTED,
          },
        },
        { new: true, session },
      );

      if (!invitation) {
        throw new APIError({
          status: StatusCode.BAD_REQUEST,
          message: APIErrorKeys.organization.acceptInvitation.notFound,
        });
      }

      await MemberInvitationModel.deleteMany(
        {
          inviteeEmail: user.email,
          inviterId: { $ne: invitation.inviterId },
          status: InvitationStatus.PENDING,
        },
        { session },
      );

      await MemberInvitationModel.deleteMany(
        {
          inviterId: user._id,
        },
        { session },
      );

      await UserModel.updateOne(
        { _id: invitation.inviterId },
        {
          $addToSet: {
            roles: UserRoles.OWNER,
          },
        },
        { session },
      );

      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            organizationId: invitation.inviterId,
            permissions: Object.fromEntries(
              ["products", "tags", "categories", "orders"].map((entity) => [
                entity,
                {
                  [CRUDPermissions.CREATE]: false,
                  [CRUDPermissions.READ]: true,
                  [CRUDPermissions.UPDATE]: false,
                  [CRUDPermissions.DELETE]: false,
                },
              ]),
            ),
          },
          $addToSet: {
            roles: UserRoles.MEMBER,
          },
        },
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const removeMember: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);
    const { memberId } = req.body;

    await withTransaction(async (session) => {
      await UserModel.updateOne(
        { _id: memberId },
        {
          $unset: { organizationId: "", permissions: "" },
          $pull: { roles: UserRoles.MEMBER },
        },
        { session },
      );

      const remainingMembersCount = await UserModel.countDocuments(
        { organizationId: user._id },
        { session },
      );

      if (remainingMembersCount === 0) {
        await UserModel.updateOne(
          { _id: user._id },
          { $pull: { roles: UserRoles.OWNER } },
          { session },
        );
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const getOrgMembers: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const matchStage = user.organizationId
      ? {
          $or: [
            { organizationId: user.organizationId },
            { _id: user._id },
            { _id: user.organizationId },
          ],
        }
      : {
          $or: [{ organizationId: user._id }, { _id: user._id }],
        };

    const members = await UserModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          sortPriority: {
            $cond: [
              { $eq: ["$_id", user._id] },
              0,
              {
                $cond: [
                  { $in: [UserRoles.OWNER, { $ifNull: ["$roles", []] }] },
                  1,
                  2,
                ],
              },
            ],
          },
        },
      },
      { $sort: { sortPriority: 1, createdAt: -1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          company: {
            $cond: [
              { $in: [UserRoles.OWNER, "$roles"] },
              "$company",
              "$$REMOVE",
            ],
          },
          email: 1,
          avatar: 1,
          roles: 1,
          ...(!user.organizationId ? { permissions: 1 } : {}),
        },
      },
    ]);

    res.status(StatusCode.OK).json(members);
  } catch (e) {
    errorHandler(e, res);
  }
};

const leaveOrg: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    await withTransaction(async (session) => {
      await UserModel.updateOne(
        { _id: user._id },
        {
          $unset: { organizationId: "", permissions: "" },
          $pull: { roles: UserRoles.MEMBER },
        },
        { session },
      );

      const remainingMembersCount = await UserModel.countDocuments(
        { organizationId: user.organizationId },
        { session },
      );

      if (remainingMembersCount === 0) {
        await UserModel.updateOne(
          { _id: user.organizationId },
          { $pull: { roles: UserRoles.OWNER } },
          { session },
        );
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const manageMembersPermissions: RequestHandler = async (req, res) => {
  try {
    const { members } = req.body;

    const { userId } = RequestContext<{ userId: string }>(req);

    await UserModel.bulkWrite(
      Object.entries(members).map(([memberId, permissions]) => {
        const typedPermissions = permissions as Record<
          PermissionEntities,
          Record<CRUDPermissions, boolean>
        >;

        const normalizedPermissions = Object.fromEntries(
          Object.entries(typedPermissions).map(([entity, crudPermissions]) => {
            const typedCrud = crudPermissions as Record<
              CRUDPermissions,
              boolean
            >;

            return [
              entity,
              typedCrud.READ
                ? typedCrud
                : {
                    CREATE: false,
                    READ: false,
                    UPDATE: false,
                    DELETE: false,
                  },
            ];
          }),
        );

        return {
          updateOne: {
            filter: {
              _id: memberId,
              organizationId: userId,
            },
            update: {
              $set: {
                permissions: normalizedPermissions,
              },
            },
          },
        };
      }),
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export {
  inviteMembers,
  getOwnerInvitations,
  getJoinOrgInvitations,
  cancelInvitation,
  declineInvitation,
  acceptInvitation,
  getOrgMembers,
  removeMember,
  leaveOrg,
  manageMembersPermissions,
};
