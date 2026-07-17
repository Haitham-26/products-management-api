import UserModel, { User } from "../models/User.model";
import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateJWTs";
import { UploadService } from "../services/upload.service";
import isUndefined from "lodash/isUndefined";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";
import { errorHandler } from "../errors/errorHandler";

const getUserById = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const user = await UserModel.findOne(
      { _id: userId },
      "-password -tokenVersion -optCode -forgotPasswordCode",
    );

    if (!user) {
      throw new APIError({
        status: StatusCode.NOT_FOUND,
        message: APIErrorKeys.user.get.notFound,
      });
    }

    res.status(StatusCode.OK).json(user);
  } catch (e) {
    errorHandler(e, res);
  }
};

const updateUser = async (req: express.Request, res: express.Response) => {
  try {
    const { name, company, avatar } = req.body;

    const { userId, user } = RequestContext<{ userId: string; user: User }>(
      req,
    );

    let avatarUrl: string | null | undefined;
    let avatarPublicId: string | null | undefined = user.avatarPublicId;

    if (req.file) {
      const uploaded = await UploadService.uploadImage(req.file, "avatars");
      avatarUrl = uploaded.secure_url;
      avatarPublicId = uploaded.public_id;
    } else if (avatar === "null" || (!avatar?.length && !isUndefined(avatar))) {
      avatarUrl = null;
      avatarPublicId = null;
    } else {
      avatarUrl = avatar;
    }

    const previousAvatarPublicId = user.avatarPublicId;
    const isAvatarChanging = avatarPublicId !== previousAvatarPublicId;

    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          name,
          company,
          avatar: avatarUrl ?? null,
          avatarPublicId: avatarPublicId ?? null,
        },
      },
    );

    if (isAvatarChanging && previousAvatarPublicId) {
      await UploadService.deleteImage(previousAvatarPublicId);
    }

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const resetPassword = async (req: express.Request, res: express.Response) => {
  try {
    const { newPassword } = req.body;

    const { userId } = RequestContext<{ userId: string }>(req);

    const user = await UserModel.findOneAndUpdate(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          password: await bcrypt.hash(newPassword, 10),
        },
        $inc: {
          tokenVersion: 1,
        },
      },
      { new: true },
    );

    res.status(StatusCode.OK).send({
      accessToken: generateAccessToken(
        user!._id.toString(),
        user!.tokenVersion,
      ),
      refreshToken: generateRefreshToken(
        user!._id.toString(),
        user!.tokenVersion,
      ),
    });
  } catch (e) {
    errorHandler(e, res);
  }
};

export { getUserById, updateUser, resetPassword };
