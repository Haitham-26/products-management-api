import express from "express";
import { RequestContext } from "../../utils/RequestContext";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { ThrowZodError } from "../../utils/ThrowZodError";
import z from "zod";
import UserModel, { User } from "../../models/User.model";

const inviteMembersSchema = z
  .object({
    emails: z
      .array(z.email("All emails must be valid email addresses"))
      .min(1, "At least one email is required")
      .refine((emails) => new Set(emails).size === emails.length, {
        message:
          "Duplicate emails found, please make sure all emails are unique.",
      }),
  })
  .loose();

export const InviteMembersValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const body = inviteMembersSchema.parse(req.body);
    req.body = body;

    if (req.body.emails.includes(user.email)) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "You cannot invite yourself, please remove your email",
      });
      return;
    }

    const usersInOrgs = await UserModel.find({
      email: { $in: req.body.emails },
      organizationId: { $type: "objectId" },
    });

    if (usersInOrgs.length) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: `Some of the invited emails are already in an organization: ${usersInOrgs.map((user) => user.email).join(", ")}`,
      });
      return;
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
