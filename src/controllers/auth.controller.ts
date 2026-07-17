import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import UserModel, { User } from "../models/User.model";
import { generateVerificationToken } from "../utils/generateVerificationToken";
import { sendSignUpTokenEmail, sendForgotPasswordTokenEmail } from "../mailer";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import { SignUpMethods } from "../types/auth/shared/SignUpMethods";
import { withTransaction } from "../utils/withTransaction";
import SettingsModel from "../models/Settings.model";
import { RequestContext } from "../utils/RequestContext";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateJWTs";
import { AppLangs } from "../types/settings/types/AppLangs.enum";
import { SignUpEmailDto } from "../types/auth/signup/SignUpEmailDto";
import { errorHandler } from "../errors/errorHandler";

const createAuthTokens = (userId: string, tokenVersion: number) => ({
  accessToken: generateAccessToken(userId, tokenVersion),
  refreshToken: generateRefreshToken(userId, tokenVersion),
});

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

    await withTransaction(async (session) => {
      await UserModel.updateOne(
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
        { session },
      );

      await SettingsModel.create(
        [
          {
            userId: user._id,
          },
        ],
        { session },
      );
    });

    const { password, tokenVersion, optCode, ...safeUser } = user;

    res.status(StatusCode.OK).send({
      user: safeUser,
      ...createAuthTokens(user._id.toString(), user.tokenVersion || 0),
    });
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

    const { password: _password, tokenVersion, ...safeUser } = user;

    res.status(StatusCode.OK).send({
      user: safeUser,
      ...createAuthTokens(user._id.toString(), user.tokenVersion),
    });
  } catch (e) {
    res.status(StatusCode.INTERNAL_ERROR).send(e);
  }
};

const refreshToken: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    res.status(StatusCode.OK).send({
      accessToken: generateAccessToken(user._id.toString(), user.tokenVersion),
    });
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

    const { password, forgotPasswordCode, tokenVersion, optCode, ...safeUser } =
      _user!.toObject();

    res.status(StatusCode.OK).send({
      user: safeUser,
      ...createAuthTokens(_user!._id.toString(), _user!.tokenVersion),
    });
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

    await UserModel.updateOne(
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
    );

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
};
