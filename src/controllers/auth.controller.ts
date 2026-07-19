import { RequestHandler, Response } from "express";
import bcrypt from "bcrypt";
import UserModel, { User } from "../models/User.model";
import { generateVerificationToken } from "../utils/generateVerificationToken";
import { sendSignUpTokenEmail, sendForgotPasswordTokenEmail } from "../mailer";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../types/auth/shared/SignUpMethods";
import { withTransaction } from "../utils/withTransaction";
import SettingsModel from "../models/Settings.model";
import { RequestContext } from "../utils/RequestContext";
import { createAuthSession, hashToken } from "../utils/authUtils";
import { AppLangs } from "../types/settings/types/AppLangs.enum";
import { SignUpEmailDto } from "../types/auth/signup/SignUpEmailDto";
import { errorHandler } from "../errors/errorHandler";
import { RefreshTokenModel } from "../models/Refresh-token.model";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";

const getEmailLang = (lang: string) => {
  if (Object.values(AppLangs).includes(lang as AppLangs)) {
    return lang as AppLangs;
  }

  return AppLangs.EN;
};

const getEmailDir = (dir: string): "rtl" | "ltr" => {
  if (["rtl", "ltr"].includes(dir)) {
    return dir as "rtl" | "ltr";
  }

  return "ltr";
};

const signUpEmail: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, company, lang, dir } =
      req.body as SignUpEmailDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = generateVerificationToken();

    await UserModel.create({
      name,
      company,
      email,
      password: hashedPassword,
      emailVerified: false,
      optCode: {
        code: token,
        createdAt: new Date(),
      },
      signUpMethod: SignUpMethods.EMAIL,
    });

    const emailLang = getEmailLang(lang);
    const emailDir = getEmailDir(dir);

    await sendSignUpTokenEmail(email, token, emailLang, emailDir);

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const signUpToken: RequestHandler = async (req, res) => {
  try {
    // This comes from SignUpTokenValidator
    const { user } = RequestContext<{ user: User }>(req);

    let _user = user;

    await withTransaction(async (session) => {
      _user = (await UserModel.findOneAndUpdate(
        { _id: user._id },
        {
          emailVerified: true,
          $unset: {
            optCode: "",
          },
          $set: {
            tokenVersion: 0,
          },
        },
        { session, new: true },
      )) as User;

      await SettingsModel.create(
        [
          {
            userId: user._id,
          },
        ],
        { session },
      );
    });

    await createAuthSession(res, _user);
  } catch (e) {
    errorHandler(e, res);
  }
};

const signupResendToken: RequestHandler = async (req, res) => {
  try {
    const { lang, dir } = req.body;

    const { user } = RequestContext<{ user: User }>(req);

    const newToken = generateVerificationToken();

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          optCode: {
            code: newToken,
            createdAt: new Date(),
          },
        },
      },
    );

    const emailLang = getEmailLang(lang);
    const emailDir = getEmailDir(dir);

    await sendSignUpTokenEmail(user.email, newToken, emailLang, emailDir);

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const login: RequestHandler = async (req, res) => {
  try {
    // This comes from LoginValidator
    const { user } = RequestContext<{ user: User }>(req);

    await createAuthSession(res, user);
  } catch (e) {
    errorHandler(e, res);
  }
};

const refreshToken: RequestHandler = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    const { user } = RequestContext<{ user: User }>(req);

    const hashedOldToken = hashToken(oldRefreshToken);

    await RefreshTokenModel.deleteOne({
      hashedToken: hashedOldToken,
    });

    await createAuthSession(res, user, false);
  } catch (e) {
    errorHandler(e, res);
  }
};

const googleLogin: RequestHandler = async (req, res) => {
  try {
    // these come from GoogleLoginValidator
    const { user, name, picture, email } = RequestContext<{
      user: User | null;
      name: string;
      picture: string;
      email: string;
    }>(req);

    let _user = user;

    if (!user) {
      await withTransaction(async (session) => {
        const [newUser] = await UserModel.create(
          [
            {
              email,
              name,
              avatar: picture,
              emailVerified: true,
              signUpMethod: SignUpMethods.GOOGLE,
              tokenVersion: 0,
            },
          ],
          { session },
        );

        _user = newUser as unknown as User;

        await SettingsModel.create([{ userId: _user!._id }], { session });
      });
    }

    await createAuthSession(res, _user!);
  } catch (e) {
    errorHandler(e, res);
  }
};

const forgotPasswordEmail: RequestHandler = async (req, res) => {
  try {
    const { lang, dir } = req.body;

    const { user } = RequestContext<{ user: User }>(req);

    const token = generateVerificationToken();

    await UserModel.updateOne(
      { email: user.email },
      {
        $set: {
          forgotPasswordCode: {
            code: token,
            createdAt: new Date(),
          },
        },
      },
    );

    const emailLang = getEmailLang(lang);
    const emailDir = getEmailDir(dir);

    await sendForgotPasswordTokenEmail(user.email, token, emailLang, emailDir);

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const forgotPasswordToken: RequestHandler = async (req, res) => {
  try {
    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const forgotPasswordNew: RequestHandler = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          password: await bcrypt.hash(newPassword, 10),
        },
        $inc: {
          tokenVersion: 1,
        },
        $unset: {
          forgotPasswordCode: "",
        },
      },
      { new: true },
    );

    if (!user) {
      throw new APIError({
        status: StatusCode.BAD_REQUEST,
        message: APIErrorKeys.internal,
      });
    }

    await RefreshTokenModel.deleteMany({
      userId: user._id,
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const logout: RequestHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);

      await RefreshTokenModel.deleteOne({
        hashedToken,
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export {
  signUpEmail,
  login,
  signUpToken,
  signupResendToken,
  googleLogin,
  refreshToken,
  forgotPasswordEmail,
  forgotPasswordToken,
  forgotPasswordNew,
  logout,
};
