import { RequestHandler } from "express";
import { errorHandler } from "../../errors/errorHandler";
import UserModel, { User } from "../../models/User.model";
import z from "zod";
import { APIErrorKeys } from "../../errors/APIError-keys";
import { Types } from "mongoose";
import { RequestContext } from "../../utils/RequestContext";
import { APIError } from "../../errors/APIError";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";

const TRANSLATION_KEY_PREFIX = APIErrorKeys.organization.removeMember;

const removeMemberSchema = z.object({
  memberId: z
    .string(TRANSLATION_KEY_PREFIX.invalidId)
    .refine((val) => Types.ObjectId.isValid(val), {
      message: TRANSLATION_KEY_PREFIX.invalidId,
    }),
});

export const RemoveMemberValidator: RequestHandler = async (req, res, next) => {
  try {
    const body = removeMemberSchema.parse(req.body);
    req.body = body;

    const { user } = RequestContext<{ user: User }>(req);

    const { memberId } = req.body;

    const member = await UserModel.findOne({
      _id: memberId,
      organizationId: user._id,
    });

    if (!member) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: TRANSLATION_KEY_PREFIX.notMember,
      });
    }

    next();
  } catch (e) {
    errorHandler(e, res);
  }
};
