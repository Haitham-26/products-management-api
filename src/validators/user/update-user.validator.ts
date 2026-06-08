import z from "zod";
import express from "express";
import { Regexes } from "../../utils/String";
import { ThrowZodError } from "../../utils/ThrowZodError";
import { RequestContext } from "../../utils/RequestContext";
import UserModel from "../../models/User.model";
import { StatusCode } from "../../types/shared/dto/StatusCode.enum";

const userUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "الاسم يجب ان يكون على الاقل 3 حروف")
      .max(30, "الاسم يجب ان يكون على الاكثر 30 حرف")
      .regex(Regexes.NAME, "الاسم يحتوي على رموز غير صالحة"),
  })
  .partial();

export const UserUpdateValidator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> => {
  try {
    const { userId } = RequestContext<{ userId: string }>(req);

    const body = userUpdateSchema.parse(req.body);
    req.body = body;

    next();
  } catch (e) {
    ThrowZodError(res, e);
  }
};
