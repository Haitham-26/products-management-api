import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import {
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
} from "../controllers/member-invitation.controller";
import { InviteMembersValidator } from "../validators/users-permissions/invite-members.validator";
import { NonOrgMemberMiddleware } from "../middlewares/NonOrgMemberMiddleware";
import { CancelInvitationValidator } from "../validators/users-permissions/cancel-invitation.validator";
import { DeclineInvitationValidator } from "../validators/users-permissions/decline-invitation.validator";
import { AcceptInvitationValidator } from "../validators/users-permissions/accept-invitation.validator";
import { ManageMembersPermissionsValidator } from "../validators/users-permissions/manage-members-permissions.validator";

const membersInvitationRouter = express.Router();

membersInvitationRouter.patch(
  "/update",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  ManageMembersPermissionsValidator,
  manageMembersPermissions,
);

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

membersInvitationRouter.post(
  "/accept-invitation",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  AcceptInvitationValidator,
  acceptInvitation,
);

membersInvitationRouter.post("/members", AuthMiddleware, getOrgMembers);

membersInvitationRouter.post(
  "/members/remove",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  removeMember,
);

membersInvitationRouter.post("/organization/leave", AuthMiddleware, leaveOrg);

export default membersInvitationRouter;
