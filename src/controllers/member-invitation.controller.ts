import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import MemberInvitationModel from "../models/Member-invitation.model";
import { sendMemberInvitationEmail } from "../mailer";
import { User } from "../models/User.model";
import { InvitationStatus } from "../types/users-permissions/types/InvitationStatus.enum";
import { Types } from "mongoose";

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
          },
          update: {
            $set: { status: InvitationStatus.PENDING },
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

export {
  inviteMembers,
  getOwnerInvitations,
  getJoinOrgInvitations,
  cancelInvitation,
};
