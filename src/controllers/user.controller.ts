import UserModel from "../models/User.model";
import express from "express";
import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";

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
    const { name } = req.body;

    const { userId } = RequestContext<{ userId: string }>(req);

    const updateDto = {
      name: name?.trim(),
    };

    await UserModel.findByIdAndUpdate(userId, { $set: updateDto });

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

export { getUserById, updateUser };
