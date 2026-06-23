import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  inviteMembers,
  getOwnerInvitations,
  getJoinOrgInvitations,
} from "../controllers/member-invitation.controller";
import { InviteMembersValidator } from "../validators/users-permissions/invite-members.validator";
import { NonOrgMemberMiddleware } from "../middlewares/NonOrgMemberMiddleware";

const membersInvitationRouter = express.Router();

membersInvitationRouter.post(
  "/owner-invitations",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  getOwnerInvitations,
);

membersInvitationRouter.post(
  "/join-org-invitations",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  getJoinOrgInvitations,
);

membersInvitationRouter.post(
  "/invite-members",
  AuthMiddleware,
  InviteMembersValidator,
  inviteMembers,
);

export default membersInvitationRouter;
