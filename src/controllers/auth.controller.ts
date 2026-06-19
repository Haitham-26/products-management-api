import express from "express";
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
import { generateJWT } from "../utils/generateJWT";

//Sign Up - Email
const signUpEmail = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body as SignUpEmailDto;

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
      ...req.body,
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

// Sign Up - Token
const signUpToken = async (req: express.Request, res: express.Response) => {
  try {
    const { email, token } = req.body as SignUpToken;

    const isEmailExist = await UserModel.findOne({
      email,
      emailVerified: false,
    });

    if (!isEmailExist) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "This email does not exist",
      });
      return;
    }

    if (isEmailExist.optCode !== token) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Incorrect verification code",
      });
      return;
    }

    // Token expires in 5 minutes
    const signUpTokenExpiryMs = 5 * 60 * 1000;

    if (Date.now() - isEmailExist.createdAt.getTime() >= signUpTokenExpiryMs) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "The verification code has expired",
      });
      return;
    }

    await withTransaction(async (session) => {
      await UserModel.updateOne(
        { _id: isEmailExist._id },
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
            userId: isEmailExist._id,
          },
        ],
        { session },
      );
    });

    res.status(StatusCode.OK).send({
      user: isEmailExist,
      token: generateJWT(
        isEmailExist._id.toString(),
        isEmailExist.tokenVersion || 0,
      ),
    });
  } catch (e) {
    console.log(e);
    res.status(StatusCode.INTERNAL_ERROR).send(e);
  }
};

const signupResendToken = async (
  req: express.Request,
  res: express.Response,
) => {
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

//Login
const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body as LoginDto;

    const user = await UserModel.findOne({ email });

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

    res.status(StatusCode.OK).send({
      user,
      token: generateJWT(user._id.toString(), user.tokenVersion),
    });
  } catch (e) {
    console.log(e);
    res.status(StatusCode.INTERNAL_ERROR).send(e);
  }
};

const googleLogin = async (req: express.Request, res: express.Response) => {
  const { email, name, avatar } = req.body;

  try {
    let user = await UserModel.findOne({ email });

    if (user && user?.signUpMethod !== SignUpMethods.GOOGLE) {
      res.status(StatusCode.BAD_REQUEST).send({
        message:
          "This account was created with a different sign-up method. Please login with the correct method.",
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
              avatar,
              emailVerified: true,
              signUpMethod: SignUpMethods.GOOGLE,
            },
          ],
          { session },
        );

        user = newUser;

        await SettingsModel.create(
          [
            {
              userId: user._id,
            },
          ],
          { session },
        );
      });
    }

    res.status(StatusCode.OK).send({
      user,
      token: generateJWT(user!._id.toString(), user!.tokenVersion),
    });
  } catch (e) {
    res.status(StatusCode.INTERNAL_ERROR).send(e);
  }
};

const forgotPasswordEmail = async (
  req: express.Request,
  res: express.Response,
) => {
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

const forgotPasswordToken = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    res.status(StatusCode.OK).send();
  } catch (e) {
    console.log(e);
  }
};

const forgotPasswordNew = async (
  req: express.Request,
  res: express.Response,
) => {
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
  forgotPasswordEmail,
  forgotPasswordToken,
  forgotPasswordNew,
};
