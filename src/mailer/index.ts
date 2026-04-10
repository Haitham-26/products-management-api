import nodemailer from "nodemailer";

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

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const formattedHtml = html.replace(
      /{{logo}}/g,
      `${process.env.CLIENT_URL}/images/logo.png`
    );

    await transporter.sendMail({
      from: `"BeSaraha" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: formattedHtml,
    });
  } catch (e) {
    console.log("Email error:", e);
  }
};

export default sendEmail;
