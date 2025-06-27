import mongoose, { model } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name."],
    },
    email: {
      type: String,
      required: [true, "Please enter an email."],
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
    },
    phone: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

export default User;
