import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";
import { AppLangs } from "../types/settings/types/AppLangs.enum";

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

const generateTokenTemplate = async (
  title: string,
  body: string,
  token: string,
  lang: AppLangs,
  dir: "rtl" | "ltr",
) => {
  const templatePath = path.join(__dirname, "./templates/template-token.html");
  const logoUrl = `${process.env.BASE_URL}/images/logo.png`;

  const content = {
    [AppLangs.EN]: {
      info: "This verification code expires in 5 minutes.",
      warning:
        "If you think this email was sent to you by mistake, you can safely ignore this email.",
      rights: "© 2026 Inventix. All rights reserved.",
      dontReply: "This is an automated email. Please do not reply.",
    },
    [AppLangs.AR]: {
      info: "صلاحية رمز التحقق 5 دقائق.",
      warning: "إذا كنت تظن أن هذا البريد أرسل لك عن طريق الخطأ يمكنك تجاهله.",
      rights: "© 2026 Inventix. ججميع الحقوق محفوظة.",
      dontReply: "هذا بريد تلقائي. يرجى عدم الرد عليه.",
    },
  };

  let html = await fs.readFile(templatePath, "utf-8");

  html = html
    .replace(/{{logoUrl}}/g, logoUrl)
    .replace(/{{lang}}/g, lang)
    .replace(/{{dir}}/g, dir)
    .replaceAll(/{{title}}/g, title)
    .replace(/{{body}}/g, body)
    .replace(/{{token}}/g, token)
    .replace(/{{info}}/g, content[lang].info)
    .replace(/{{warning}}/g, content[lang].warning)
    .replace(/{{rights}}/g, content[lang].rights)
    .replace(/{{dontReply}}/g, content[lang].dontReply);

  return html;
};

const generateLinkTemplate = async (
  title: string,
  body: string,
  link: string,
  linkTitle: string,
  lang: AppLangs,
  dir: "rtl" | "ltr",
) => {
  const templatePath = path.join(__dirname, "./templates/template-link.html");
  const logoUrl = `${process.env.BASE_URL}/images/logo.png`;

  const content = {
    [AppLangs.EN]: {
      backupLinkText: "If the button doesn’t work, copy and open this link:",
      warning:
        "If you think this email was sent to you by mistake, you can safely ignore this email.",
      rights: "© 2026 Inventix. All rights reserved.",
      dontReply: "This is an automated email. Please do not reply.",
    },
    [AppLangs.AR]: {
      backupLinkText: "اذا لم يعمل الزر، قم بنسخ وفتح هذا الرابط:",
      warning: "إذا كنت تظن أن هذا البريد أرسل لك عن طريق الخطأ يمكنك تجاهله.",
      rights: "© 2026 Inventix. جميع الحقوق محفوظة.",
      dontReply: "هذا بريد تلقائي. يرجى عدم الرد عليه.",
    },
  };

  let html = await fs.readFile(templatePath, "utf-8");

  html = html
    .replace(/{{logoUrl}}/g, logoUrl)
    .replace(/{{lang}}/g, lang)
    .replace(/{{dir}}/g, dir)
    .replaceAll(/{{title}}/g, title)
    .replace(/{{body}}/g, body)
    .replace(/{{link}}/g, link)
    .replace(/{{linkTitle}}/g, linkTitle)
    .replace(/{{backupLinkText}}/g, content[lang].backupLinkText)
    .replace(/{{warning}}/g, content[lang].warning)
    .replace(/{{rights}}/g, content[lang].rights)
    .replace(/{{dontReply}}/g, content[lang].dontReply);

  return html;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Inventix" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.log("Email error:", e);
  }
};

const sendSignUpTokenEmail = async (
  to: string,
  token: string,
  lang: AppLangs,
  dir: "rtl" | "ltr",
) => {
  try {
    const content = {
      [AppLangs.EN]: {
        title: "Email Verification",
        body: "To confirm your email address and activate your account, please enter the verification code:",
      },
      [AppLangs.AR]: {
        title: "التحقق من البريد الإلكتروني",
        body: "لتأكيد عنوان البريد الإلكتروني الخاص بك وتفعيل حسابك، يرجى إدخال رمز التحقق:",
      },
    };

    const html = await generateTokenTemplate(
      content[lang].title,
      content[lang].body,
      token,
      lang,
      dir,
    );

    await sendEmail(to, content[lang].title, html);
  } catch (e) {
    console.log(e);
  }
};

const sendForgotPasswordTokenEmail = async (
  to: string,
  token: string,
  lang: AppLangs,
  dir: "rtl" | "ltr",
) => {
  try {
    const content = {
      [AppLangs.EN]: {
        title: "Password Reset",
        body: "To reset your password, please enter the verification code:",
      },
      [AppLangs.AR]: {
        title: "إعادة ضبط كلمة المرور",
        body: "لإعادة ضبط كلمة المرور الخاصة بك، يرجى إدخال رمز التحقق:",
      },
    };

    const html = await generateTokenTemplate(
      content[lang].title,
      content[lang].body,
      token,
      lang,
      dir,
    );

    await sendEmail(to, content[lang].title, html);
  } catch (e) {
    console.log(e);
  }
};

const sendMemberInvitationEmail = async (
  to: string,
  organizationOwnerName: string,
  lang: AppLangs,
  dir: "rtl" | "ltr",
) => {
  try {
    const content = {
      [AppLangs.EN]: {
        title: "Join Organization Invitation",
        body: `
          You have been invited to join ${organizationOwnerName}'s organization.<br/><br/>
          Click the link below to continue.
        `,
        linkTitle: "Join Organization",
      },
      [AppLangs.AR]: {
        title: "دعوة للانضمام لمنظمة",
        body: `
          تم دعوتك للانضمام لمنظمة ${organizationOwnerName}.<br/><br/>
          يرجى النقر على الرابط التالي للمتابعة.
        `,
        linkTitle: "الانضمام للمنظمة",
      },
    };

    const html = await generateLinkTemplate(
      content[lang].title,
      content[lang].body,
      process.env.CLIENT_URL!,
      content[lang].linkTitle,
      lang,
      dir,
    );

    await sendEmail(to, content[lang].title, html);
  } catch (e) {
    console.log(e);
  }
};

export {
  sendEmail,
  sendSignUpTokenEmail,
  sendForgotPasswordTokenEmail,
  sendMemberInvitationEmail,
};
