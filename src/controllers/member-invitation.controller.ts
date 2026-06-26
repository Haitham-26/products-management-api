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

export {
  inviteMembers,
  getOwnerInvitations,
  getJoinOrgInvitations,
  cancelInvitation,
  declineInvitation,
  acceptInvitation,
};
