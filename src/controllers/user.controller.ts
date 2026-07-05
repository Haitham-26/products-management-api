import UserModel, { User } from "../models/User.model";
import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import { generateJWT } from "../utils/generateJWT";
import { UploadService } from "../services/upload.service";
import isUndefined from "lodash/isUndefined";

const getUserById = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(StatusCode.NOT_FOUND).send("User not found");
      return;
    }

    res.status(StatusCode.OK).json(user);
  } catch (e) {
    console.log(e);
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
      const uploaded = await UploadService.uploadImage(req.file);
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
    console.log(e);
    res
      .status(StatusCode.INTERNAL_ERROR)
      .send({ message: "Failed to update user" });
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

    res
      .status(StatusCode.OK)
      .send({ token: generateJWT(user!._id.toString(), user!.tokenVersion) });
  } catch (e) {
    console.log(e);
  }
};

export { getUserById, updateUser, resetPassword };
