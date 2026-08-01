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
} from "../controllers/organization.controller";
import { InviteMembersValidator } from "../validators/organization/invite-members.validator";
import { NonOrgMemberMiddleware } from "../middlewares/NonOrgMemberMiddleware";
import { CancelInvitationValidator } from "../validators/organization/cancel-invitation.validator";
import { DeclineInvitationValidator } from "../validators/organization/decline-invitation.validator";
import { AcceptInvitationValidator } from "../validators/organization/accept-invitation.validator";
import { ManageMembersPermissionsValidator } from "../validators/organization/manage-members-permissions.validator";
import { LeaveOrgValidator } from "../validators/organization/leave-org.validator";
import { RemoveMemberValidator } from "../validators/organization/remove-member.validator";

const organizationRouter = express.Router();

/**
 * @openapi
 * /organization/members:
 *   get:
 *     summary: Gets organization members.
 *     description: Gets organization members for owner and member.
 *     tags:
 *       - Organization
 *     responses:
 *       200:
 *         description: Members fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetOrgMembersResponseSchema'
 */
organizationRouter.get("/members", AuthMiddleware, getOrgMembers);

/**
 * @openapi
 * /organization/owner/invitations:
 *   get:
 *     summary: Gets organization owner's invitations
 *     description: Gets the invitations of the organization owner that he has sent.
 *     tags:
 *       - Organization
 *     responses:
 *       200:
 *         description: Organization owner's invitations fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetOwnerInvitationsResponseSchema'
 */
organizationRouter.get(
  "/owner/invitations",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  getOwnerInvitations,
);

/**
 * @openapi
 * /organization/owner/invite-members:
 *   post:
 *     summary: Invites members to the organization
 *     description: Invites members to the organization.
 *     tags:
 *       - Organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteMembersRequestSchema'
 *     responses:
 *       200:
 *         description: Members invited successfully.
 */
organizationRouter.post(
  "/owner/invite-members",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  InviteMembersValidator,
  inviteMembers,
);

/**
 * @openapi
 * /organization/owner/invitation/cancel:
 *   post:
 *     summary: Cancels a pending invitation
 *     description: Cancels a pending invitation by the organization owner.
 *     tags:
 *       - Organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericWithInvitationIdRequestSchema'
 *     responses:
 *       200:
 *         description: Invitation canceled successfully.
 */
organizationRouter.post(
  "/owner/invitation/cancel",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  CancelInvitationValidator,
  cancelInvitation,
);

/**
 * @openapi
 * /organization/owner/members/manage:
 *   patch:
 *     summary: Manages members permissions
 *     description: Manages members permissions by the organization owner.
 *     tags:
 *       - Organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMembersPermissionsRequestSchema'
 *     responses:
 *       200:
 *         description: Members permissions updated successfully.
 */
organizationRouter.patch(
  "/owner/members/manage",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  ManageMembersPermissionsValidator,
  manageMembersPermissions,
);

/**
 * @openapi
 * /organization/owner/members/remove:
 *   post:
 *     summary: Removes a member from the organization
 *     description: Removes a member from the organization by the organization owner.
 *     tags:
 *       - Organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveMemberRequestSchema'
 *     responses:
 *       200:
 *         description: Member removed successfully.
 */
organizationRouter.post(
  "/owner/members/remove",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  RemoveMemberValidator,
  removeMember,
);

/**
 * @openapi
 * /organization/member/invitations:
 *   get:
 *     summary: Gets member's invitations
 *     description: Gets the invitations of a user that is a not in an organization has received.
 *     tags:
 *       - Organization
 *     responses:
 *       200:
 *         description: User's invitations fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetJoinOrgInvitationsResponseSchema'
 */
organizationRouter.get(
  "/member/invitations",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  getJoinOrgInvitations,
);

/**
 * @openapi
 * /organization/member/invitation/decline:
 *   post:
 *     summary: Declines an invitation
 *     description: Declines an invitation by a user that is not in an organization.
 *     tags:
 *       - Organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericWithInvitationIdRequestSchema'
 *     responses:
 *       200:
 *         description: Invitation declined successfully.
 */
organizationRouter.post(
  "/member/invitation/decline",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  DeclineInvitationValidator,
  declineInvitation,
);

/**
 * @openapi
 * /organization/member/invitation/accept:
 *   post:
 *     summary: Accepts an invitation
 *     description: Accepts an invitation by a user that is not in an organization, and joins the organization.
 *     tags:
 *       - Organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenericWithInvitationIdRequestSchema'
 *     responses:
 *       200:
 *         description: Invitation accepted successfully.
 */
organizationRouter.post(
  "/member/invitation/accept",
  AuthMiddleware,
  NonOrgMemberMiddleware,
  AcceptInvitationValidator,
  acceptInvitation,
);

/**
 * @openapi
 * /organization/member/leave:
 *   post:
 *     summary: Leaves the organization
 *     description: A user that is in an organization leaves the organization.
 *     tags:
 *       - Organization
 *     responses:
 *       200:
 *         description: Left the organization successfully.
 */
organizationRouter.post(
  "/member/leave",
  AuthMiddleware,
  LeaveOrgValidator,
  leaveOrg,
);

export default organizationRouter;
