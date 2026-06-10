import express from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/User.model";
import { generateToken } from "../utils/generateToken";
import { SignUpToken } from "../types/auth/signup/SignUpToken";
import { sendSignUpToken, sendForgotPasswordToken } from "../mailer";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import jwt from "jsonwebtoken";
import { SignUpMethods } from "../types/auth/shared/SignUpMethods";
import { withTransaction } from "../utils/withTransaction";
import SettingsModel from "../models/Settings.model";

function getJWTToken(userId: string) {
  const jwtToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return jwtToken;
}

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

    const token = generateToken();

    await UserModel.create({
      ...req.body,
      password: hashedPassword,
      emailVerified: false,
      optCode: token,
      signUpMethod: SignUpMethods.EMAIL,
    });

    await sendSignUpToken(email, token);

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
      await UserModel.findByIdAndUpdate(
        isEmailExist._id,
        {
          emailVerified: true,
          $unset: {
            optCode: "",
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
      token: getJWTToken(isEmailExist._id.toString()),
    });
  } catch (e) {
    console.log(e);
    res.status(StatusCode.INTERNAL_ERROR).send(e);
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
        message: "Incorrect password",
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(StatusCode.BAD_REQUEST).send({
        message: "Please verify your email first",
      });
      return;
    }

    res
      .status(StatusCode.OK)
      .send({ user, token: getJWTToken(user._id.toString()) });
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

    res
      .status(StatusCode.OK)
      .send({ user, token: getJWTToken(user!._id.toString()) });
  } catch (e) {
    res.status(StatusCode.INTERNAL_ERROR).send(e);
  }
};

const forgotPasswordEmail = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { email } = req.body;

    const token = generateToken();

    await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          forgotPasswordCode: {
            code: token,
            createdAt: new Date(),
          },
        },
      },
    );

    await sendForgotPasswordToken(email, token);

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

    await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          password: await bcrypt.hash(newPassword, 10),
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
  googleLogin,
  forgotPasswordEmail,
  forgotPasswordToken,
  forgotPasswordNew,
};
