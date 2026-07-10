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

const organizationRouter = express.Router();

organizationRouter.get(
  "/owner/invitations",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  getOwnerInvitations,
);

organizationRouter.post(
  "/owner/invite-members",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  InviteMembersValidator,
  inviteMembers,
);

organizationRouter.post(
  "/owner/invitation/cancel",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  CancelInvitationValidator,
  cancelInvitation,
);

organizationRouter.get("/owner/members", AuthMiddleware, getOrgMembers);

organizationRouter.patch(
  "/owner/members/manage",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  ManageMembersPermissionsValidator,
  manageMembersPermissions,
);

organizationRouter.post(
  "/owner/members/remove",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  removeMember,
);

organizationRouter.get(
  "/member/invitations",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  getJoinOrgInvitations,
);

organizationRouter.post(
  "/member/invitation/decline",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  DeclineInvitationValidator,
  declineInvitation,
);

organizationRouter.post(
  "/member/invitation/accept",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  AcceptInvitationValidator,
  acceptInvitation,
);

organizationRouter.post("/member/leave", AuthMiddleware, leaveOrg);

export default organizationRouter;
