import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import MemberInvitationModel from "../models/Member-invitation.model";
import { sendMemberInvitationEmail } from "../mailer";
import { User } from "../models/User.model";
import { InvitationStatus } from "../types/users-permissions/types/InvitationStatus.enum";

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
        insertOne: {
          document: {
            inviterId: user._id,
            inviteeEmail: email,
            status: InvitationStatus.PENDING,
          },
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

export { inviteMembers, getOwnerInvitations, getJoinOrgInvitations };
