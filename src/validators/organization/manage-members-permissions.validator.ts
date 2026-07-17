import { RequestHandler } from "express";
import z from "zod";
import { Types } from "mongoose";
import { PermissionEntities } from "../../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../../types/user/types/CRUDPermissions.enum";
import { RequestContext } from "../../utils/RequestContext";
import UserModel from "../../models/User.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { errorHandler } from "../../errors/errorHandler";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { APIError } from "../../errors/APIError";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.organization.managePermissions;

const memberPermissionEntitySchema = z.strictObject(
  Object.fromEntries(
    Object.values(CRUDPermissions).map((permission) => [
      permission,
      z.boolean(TRANSLATION_KEY_PREFIX.members.permissions.invalidType),
    ]),
  ),
);

const memberPermissionsSchema = z.strictObject(
  Object.fromEntries(
    Object.values(PermissionEntities).map((entity) => [
      entity,
      memberPermissionEntitySchema,
    ]),
  ),
);

const manageMembersPermissionsSchema = z
  .object({
    members: z
      .record(
        z
          .string(TRANSLATION_KEY_PREFIX.members.invalidId)
          .refine((val) => Types.ObjectId.isValid(val), {
            message: TRANSLATION_KEY_PREFIX.members.invalidId,
          }),
        memberPermissionsSchema,
      )
      .refine((members) => Object.keys(members).length > 0, {
        message: TRANSLATION_KEY_PREFIX.members.minLength,
      }),
  })
  .loose();

export const ManageMembersPermissionsValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = manageMembersPermissionsSchema.parse(req.body);
    req.body = body;

    const { userId } = RequestContext<{ userId: string }>(req);

    const memberIds = Object.keys(req.body.members);

    const members = await UserModel.find({
      organizationId: userId,
      _id: { $in: memberIds },
    });

    if (memberIds.includes(userId)) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.self,
      });
    }

    if (members.length !== memberIds.length) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: TRANSLATION_KEY_PREFIX.members.someNotFound,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
