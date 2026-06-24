import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
  inviteMembers,
  getOwnerInvitations,
  getJoinOrgInvitations,
  cancelInvitation,
  declineInvitation,
} from "../controllers/member-invitation.controller";
import { InviteMembersValidator } from "../validators/users-permissions/invite-members.validator";
import { NonOrgMemberMiddleware } from "../middlewares/NonOrgMemberMiddleware";
import { CancelInvitationValidator } from "../validators/users-permissions/cancel-invitation.validator";
import { DeclineInvitationValidator } from "../validators/users-permissions/decline-invitation.validator";

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
  NonOrgMemberMiddleware,
  InviteMembersValidator,
  inviteMembers,
);

membersInvitationRouter.post(
  "/cancel-invitation",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  CancelInvitationValidator,
  cancelInvitation,
);

membersInvitationRouter.post(
  "/decline-invitation",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  DeclineInvitationValidator,
  declineInvitation,
);

export default membersInvitationRouter;
