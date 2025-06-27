import express from "express";
import User from "../models/User.model";
import bcrypt from "bcrypt";

//Sign Up
const signUp = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body as SignUpDto;

    const isEmailExist = await User.findOne({ email });

    if (isEmailExist) {
      res.status(400).send("Email already exists");
      return;
    }

    if (password.length < 6) {
      res.status(400).send("Password must be at least 6 characters long");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ ...req.body, password: hashedPassword });

    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

//Login
const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body as LoginDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOne({ email, password: hashedPassword });

    if (!user) {
      res.status(404).send("Email or password incorrect");
    }

    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

export { signUp, login };
