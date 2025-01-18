import express from "express";
import User from "../models/User.model";

//Sign Up
const signUp = async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body as SignUpDto;

    const isEmailExist = await User.findOne({ email });

    if (isEmailExist) {
      res.status(400).send("Email already exists");
      return;
    }

    const user = await User.create(req.body);

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

    const user = await User.findOne({ email, password });

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
