import UserModel from "../models/User.model";
import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import { generateJWT } from "../utils/generateJWT";

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
    const { name, company } = req.body;

    const { userId } = RequestContext<{ userId: string }>(req);

    await UserModel.updateOne({ _id: userId }, { $set: { name, company } });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
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
