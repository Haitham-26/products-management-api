import express from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { inviteMembers } from "../controllers/member-invitation.controller";
import { InviteMembersValidator } from "../validators/users-permissions/invite-members.validator";
import { OrganizationOwnerOnlyMiddleware } from "../middlewares/OrganizationOwnerOnlyMiddleware";

const usersPermissionsRouter = express.Router();

usersPermissionsRouter.post(
  "/invite-members",
  AuthMiddleware,
  OrganizationOwnerOnlyMiddleware,
  InviteMembersValidator,
  inviteMembers,
);

export default usersPermissionsRouter;
