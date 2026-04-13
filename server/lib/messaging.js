import nodemailer from "nodemailer";
import twilio from "twilio";

const DEFAULT_COUNTRY_CODE = process.env.OTP_DEFAULT_COUNTRY_CODE || "+91";

export const isOtpPreviewEnabled =
  process.env.SHOW_DEV_OTP === "true" ||
  (process.env.NODE_ENV !== "production" && (process.env.SHOW_DEV_OTP ?? "true") === "true");

export const hasSmtpConfig = Boolean(process.env.SMTP_HOST);
export const hasTwilioConfig = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
);

const mailTransporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

const smsClient = hasTwilioConfig
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const normalizePhoneNumber = (value = "") => {
  const trimmed = value.trim().replace(/[\s-]/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (/^\d{10}$/.test(trimmed) && DEFAULT_COUNTRY_CODE) {
    return `${DEFAULT_COUNTRY_CODE}${trimmed}`;
  }
  return trimmed;
};

export const sendMailMessage = async (mailOptions) => {
  if (!hasSmtpConfig) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  return mailTransporter.sendMail(mailOptions);
};

export const sendSmsMessage = async ({ to, body }) => {
  if (!smsClient) {
    throw new Error("TWILIO_NOT_CONFIGURED");
  }

  const messageConfig = {
    to: normalizePhoneNumber(to),
    body,
  };

  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    messageConfig.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  } else {
    messageConfig.from = process.env.TWILIO_PHONE_NUMBER;
  }

  return smsClient.messages.create(messageConfig);
};
