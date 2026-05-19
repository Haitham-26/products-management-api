import express from "express";
import { ThrowZodError } from "../../utils/ThrowZodError";
import TagModel from "../../models/Tag.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";
import { RequestContext } from "../../utils/RequestContext";

export const DeleteTagValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const { id } = req.params;

    const tag = await TagModel.findOne({ _id: id, userId });

    if (!tag) {
      res.status(StatusCode.NOT_FOUND).send({ message: "Tag not found" });
      return;
    }

    RequestContext(req, { tag });

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
