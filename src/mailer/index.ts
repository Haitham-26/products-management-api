import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";

require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  pool: true,
  tls: {
    rejectUnauthorized: false,
  },
});

const getTokenTemplate = async (title: string, body: string, token: string) => {
  const templatePath = path.join(__dirname, "./templates/template-token.html");

  let html = await fs.readFile(templatePath, "utf-8");

  html = html
    .replace(/{{title}}/g, title)
    .replace(/{{body}}/g, body)
    .replace(/{{token}}/g, token);

  return html;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const logoPath = path.resolve("public/images/logo.png");

    await transporter.sendMail({
      from: `"Inventix" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "logo",
        },
      ],
    });
  } catch (e) {
    console.log("Email error:", e);
  }
};

const sendSignUpToken = async (to: string, token: string) => {
  try {
    const title = "Email Verification";

    const html = await getTokenTemplate(
      title,
      "To confirm your email address and activate your account, please enter the verification code:",
      token,
    );

    await sendEmail(to, title, html);
  } catch (e) {
    console.log(e);
  }
};

const sendForgotPasswordToken = async (to: string, token: string) => {
  try {
    const title = "Reset Password";

    const html = await getTokenTemplate(
      title,
      "Use the following code to continue the password reset process:",
      token,
    );

    await sendEmail(to, title, html);
  } catch (e) {
    console.log(e);
  }
};

export { sendEmail, sendSignUpToken, sendForgotPasswordToken };
