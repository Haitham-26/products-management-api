import express from "express";
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

const getOwnerInvitations = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const invitations = await MemberInvitationModel.find({
      inviterId: user._id,
    }).sort({ createdAt: -1 });

    res.status(StatusCode.OK).json({ invitations });
  } catch (e) {
    console.log(e);
  }
};

const getJoinOrgInvitations = async (
  req: express.Request,
  res: express.Response,
) => {
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
            { $project: { _id: 0, name: 1 } },
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
    console.log(e);
  }
};

const inviteMembers = async (req: express.Request, res: express.Response) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const { emails } = req.body;

    await MemberInvitationModel.bulkWrite(
      (emails as string[]).map((email) => ({
        updateOne: {
          filter: {
            inviteeEmail: email,
            status: {
              $in: [InvitationStatus.DECLINED, InvitationStatus.CANCELLED],
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

    await Promise.allSettled(
      emails.map((email: string) =>
        sendMemberInvitationEmail(email, user.name),
      ),
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const cancelInvitation = async (
  req: express.Request,
  res: express.Response,
) => {
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
          status: InvitationStatus.CANCELLED,
        },
      },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const declineInvitation = async (
  req: express.Request,
  res: express.Response,
) => {
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
    console.log(e);
  }
};

const acceptInvitation = async (
  req: express.Request,
  res: express.Response,
) => {
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
        throw new Error("Invitation not found");
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
    console.log(e);
  }
};

const removeMember = async (req: express.Request, res: express.Response) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);
    const { memberId } = req.body;

    await withTransaction(async (session) => {
      const orgMembers = await UserModel.find(
        { organizationId: user._id },
        null,
        { session },
      );

      const updateOwner =
        orgMembers.length === 1 ? { $pull: { roles: UserRoles.OWNER } } : {};

      await UserModel.updateOne({ _id: user._id }, updateOwner, { session });

      const removed = await UserModel.findOne({
        _id: memberId,
        organizationId: user._id,
      }).session(session);

      if (!removed) {
        res.status(StatusCode.NOT_FOUND).send({ message: "Member not found" });
        return;
      }

      await UserModel.updateOne(
        { _id: memberId },
        {
          $unset: { organizationId: "" },
          $pull: { roles: UserRoles.MEMBER },
        },
        { session },
      );
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const getOrgMembers = async (req: express.Request, res: express.Response) => {
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
          email: 1,
          avatar: 1,
          roles: 1,
          ...(!user.organizationId ? { permissions: 1 } : {}),
        },
      },
    ]);

    res.status(StatusCode.OK).json(members);
  } catch (e) {
    console.log(e);
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
};
