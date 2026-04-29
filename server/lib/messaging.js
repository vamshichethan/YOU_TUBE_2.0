import nodemailer from "nodemailer";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_COUNTRY_CODE = process.env.OTP_DEFAULT_COUNTRY_CODE || "+91";
const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "";
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.OTP_FROM_EMAIL || "";
const brevoSenderName = process.env.BREVO_SENDER_NAME || "YourTube";
const smtpHost = process.env.SMTP_HOST || (process.env.BREVO_SMTP_KEY ? "smtp-relay.brevo.com" : "");
const smtpPort = process.env.SMTP_PORT || (process.env.BREVO_SMTP_KEY ? "587" : "587");
const smtpUser = process.env.SMTP_USER || process.env.BREVO_SMTP_LOGIN || "";
const smtpPass = process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY || "";
const configuredTurnUrls = (process.env.TURN_URLS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const configuredStunUrls = (process.env.STUN_URLS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const defaultIceServers = [
  { urls: configuredStunUrls.length ? configuredStunUrls : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export const isOtpPreviewEnabled =
  process.env.NODE_ENV !== "production" && process.env.SHOW_DEV_OTP === "true";

export const hasBrevoApiConfig = Boolean(brevoApiKey && brevoSenderEmail);
export const hasSmtpConfig = Boolean(smtpHost && (!smtpUser || smtpPass));
export const mailDeliveryMode = hasBrevoApiConfig ? "brevo" : hasSmtpConfig ? "smtp" : "mock";
export const hasTwilioClientConfig = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
);
export const hasTwilioSmsSenderConfig = Boolean(
  process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID
);
export const hasTwilioConfig = Boolean(
  hasTwilioClientConfig && hasTwilioSmsSenderConfig
);
export const smsDeliveryMode = hasTwilioConfig ? "twilio" : "mock";
export const hasStaticTurnConfig = Boolean(
  configuredTurnUrls.length &&
    process.env.TURN_USERNAME &&
    process.env.TURN_CREDENTIAL
);

const mailTransporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: process.env.SMTP_SECURE === "true",
      auth: smtpUser
        ? {
            user: smtpUser,
            pass: smtpPass,
          }
        : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

const twilioClient = hasTwilioClientConfig
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

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const sendBrevoMailMessage = async (mailOptions) => {
  const recipients = Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to];
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    },
    body: JSON.stringify({
      sender: {
        email: brevoSenderEmail,
        name: brevoSenderName,
      },
      to: recipients.filter(Boolean).map((email) => ({ email })),
      subject: mailOptions.subject,
      htmlContent: mailOptions.html || `<p>${mailOptions.text || ""}</p>`,
      textContent: mailOptions.text || stripHtml(mailOptions.html || ""),
    }),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`Brevo email failed with status ${response.status}: ${responseBody}`);
  }

  try {
    return JSON.parse(responseBody);
  } catch {
    return { messageId: responseBody };
  }
};

export const sendMailMessage = async (mailOptions) => {
  if (hasBrevoApiConfig) {
    return sendBrevoMailMessage(mailOptions);
  }

  return mailTransporter.sendMail(mailOptions);
};

export const sendSmsMessage = async ({ to, body }) => {
  const normalizedTo = normalizePhoneNumber(to);

  if (!twilioClient || !hasTwilioConfig) {
    console.log(`[SMS OTP SIMULATION] To: ${normalizedTo}, Body: ${body}`);
    return {
      sid: `mock_sms_${Date.now()}`,
      status: "simulated",
      to: normalizedTo,
      body,
    };
  }

  const messageConfig = {
    to: normalizedTo,
    body,
  };

  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    messageConfig.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  } else {
    messageConfig.from = process.env.TWILIO_PHONE_NUMBER;
  }

  return twilioClient.messages.create(messageConfig);
};

export const getIceServers = async () => {
  if (twilioClient) {
    try {
      const token = await twilioClient.tokens.create();
      if (Array.isArray(token?.iceServers) && token.iceServers.length) {
        return token.iceServers;
      }
    } catch (error) {
      console.log("Twilio ICE token fetch failed:", error.message);
    }
  }

  if (hasStaticTurnConfig) {
    return [
      ...defaultIceServers,
      {
        urls: configuredTurnUrls,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
    ];
  }

  return defaultIceServers;
};
