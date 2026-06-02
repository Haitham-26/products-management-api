import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import MemberInvitationModel from "../models/Member-invitation.model";
import sendEmail from "../mailer";
import { User } from "../models/User.model";

const inviteMembers = async (req: express.Request, res: express.Response) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const { emails } = req.body;

    await MemberInvitationModel.bulkWrite(
      (emails as string[]).map((email) => ({
        insertOne: {
          document: {
            inviterId: user._id,
            email,
          },
        },
      })),
    );

    const generateInvitationLink = (email: string) => {
      const organizationId = user._id;

      const link = `${process.env.CLIENT_URL}/invite?organizationId=${organizationId}&inviteeEmail=${email}`;

      return link;
    };

    for (const email of emails) {
      sendEmail(
        email,
        "Invitation",
        `You have been invited to join ${user.name}'s organization. \n\n <a href="${generateInvitationLink(email)}">Click here to join</a>`,
      );
    }

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export { inviteMembers };
