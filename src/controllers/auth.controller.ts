import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import UserModel, { User } from "../models/User.model";
import { generateVerificationToken } from "../utils/generateVerificationToken";
import { SignUpToken } from "../types/auth/signup/SignUpToken";
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
import { OAuth2Client } from "google-auth-library";

const createAuthTokens = (userId: string, tokenVersion: number) => ({
  accessToken: generateAccessToken(userId, tokenVersion),
  refreshToken: generateRefreshToken(userId, tokenVersion),
});

const signUpEmail: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, company } = req.body as SignUpEmailDto;

    const isEmailExist = await UserModel.findOne({ email });

    const tokenExpiryMs = 5 * 60 * 1000;

    if (
      isEmailExist &&
      !isEmailExist.emailVerified &&
      Date.now() - isEmailExist.createdAt.getTime() >= tokenExpiryMs
    ) {
      res.status(StatusCode.BAD_REQUEST).send({
        message:
          "We already sent you a verification code. Please check your email or try again in 5 minutes",
      });
      return;
    }

    if (isEmailExist) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "An account with this email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = generateVerificationToken();

    await UserModel.create({
      name,
      company,
      email,
      password: hashedPassword,
      emailVerified: false,
      optCode: token,
      signUpMethod: SignUpMethods.EMAIL,
    });

    await sendSignUpTokenEmail(email, token);

    res
      .status(StatusCode.OK)
      .send({ message: "The verification code has been sent to your email" });
  } catch (e) {
    console.log(e);
    res.sendStatus(StatusCode.INTERNAL_ERROR);
  }
};

const signUpToken: RequestHandler = async (req, res) => {
  try {
    const { email, token } = req.body as SignUpToken;

    const user = (
      await UserModel.findOne({
        email,
        emailVerified: false,
      })
    )?.toObject();

    if (!user) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "This email does not exist",
      });
      return;
    }

    if (user.optCode !== token) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Incorrect verification code",
      });
      return;
    }

    // Token expires in 5 minutes
    const signUpTokenExpiryMs = 5 * 60 * 1000;

    if (Date.now() - user.createdAt.getTime() >= signUpTokenExpiryMs) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "The verification code has expired",
      });
      return;
    }

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
    console.log(e);
    res.status(StatusCode.INTERNAL_ERROR).send(e);
  }
};

const signupResendToken: RequestHandler = async (req, res) => {
  try {
    const { user } = RequestContext<{ user: User }>(req);

    const newToken = generateVerificationToken();

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          optCode: newToken,
        },
      },
    );

    await sendSignUpTokenEmail(user.email, newToken);

    res.status(StatusCode.OK).send({
      message: "The verification code has been sent to your email",
    });
  } catch (e) {
    console.log(e);
  }
};

const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as LoginDto;

    const user = (
      await UserModel.findOne({ email }).select("-forgotPasswordCode")
    )?.toObject();

    if (!user) {
      res.status(StatusCode.NOT_FOUND).send({
        message:
          "An account with this email does not exist. Please sign up first.",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password as string,
    );

    if (!isPasswordCorrect) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Incorrect email or password",
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Please verify your email first",
      });
      return;
    }

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
    console.log(e);
    res.status(StatusCode.UNAUTHORIZED).send("Unauthorized");
  }
};

const googleLogin: RequestHandler = async (req, res) => {
  const { idToken } = req.body;

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(400).send({ message: "Invalid Google token" });
      return;
    }

    const { email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      res.status(400).send({ message: "Your google account is not verified" });
      return;
    }

    let user = await UserModel.findOne({ email }).select(
      "-password -optCode -forgotPasswordCode",
    );

    if (user && user?.signUpMethod !== SignUpMethods.GOOGLE) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "This account was not created with a google account.",
      });
      return;
    }

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

        user = newUser;

        await SettingsModel.create([{ userId: user._id }], { session });
      });
    }

    const { password, forgotPasswordCode, tokenVersion, optCode, ...safeUser } =
      user!.toObject();

    res.status(StatusCode.OK).send({
      user: safeUser,
      ...createAuthTokens(user!._id.toString(), user!.tokenVersion),
    });
  } catch (e) {
    console.log(e);
    res.status(StatusCode.INTERNAL_ERROR).send({
      message: "Something went wrong",
    });
  }
};

const forgotPasswordEmail: RequestHandler = async (req, res) => {
  try {
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

    await sendForgotPasswordTokenEmail(user.email, token);

    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const forgotPasswordToken: RequestHandler = async (req, res) => {
  try {
    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
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
    console.log(e);
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
