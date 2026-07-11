import { RequestHandler } from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import z from "zod";
import { Types } from "mongoose";
import { PermissionEntities } from "../../types/user/types/PermissionEntities.enum";
import { CRUDPermissions } from "../../types/user/types/CRUDPermissions.enum";
import { RequestContext } from "../../utils/RequestContext";
import UserModel from "../../models/User.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";

const manageMembersPermissionsSchema = z.object({
  userId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid userId",
  }),

  members: z
    .record(
      z.string().refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid member id",
      }),

      z.object(
        Object.fromEntries(
          Object.values(PermissionEntities).map((entity) => [
            entity,
            z.object(
              Object.fromEntries(
                Object.values(CRUDPermissions).map((permission) => [
                  permission,
                  z.boolean(),
                ]),
              ),
            ),
          ]),
        ),
      ),
    )
    .refine((members) => Object.keys(members).length > 0, {
      message: "At least one member is required",
    }),
});

export const ManageMembersPermissionsValidator: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const body = manageMembersPermissionsSchema.parse(req.body);
    req.body = body;

    const { userId } = RequestContext<{ userId: string }>(req);

    const memberIds = Object.keys(body.members);

    const members = await UserModel.find({
      organizationId: userId,
      _id: { $in: memberIds },
    });

    if (memberIds.includes(userId)) {
      res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "You cannot manage your own permissions" });
      return;
    }

    if (members.length !== memberIds.length) {
      res
        .status(StatusCode.NOT_FOUND)
        .send({ message: "Some members not found in your organization" });
      return;
    }

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
