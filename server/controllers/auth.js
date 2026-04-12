import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";
import { fallbackUsers } from "../utils/fallbackStore.js";

const SOUTH_INDIA_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
const otpCache = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?\d{10,15}$/;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const transporter = process.env.SMTP_HOST
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

const normalizeState = (value = "") => value.trim();
const isDatabaseReady = () => mongoose.connection.readyState === 1;
const isSouthIndiaState = (state = "") => SOUTH_INDIA_STATES.includes(normalizeState(state));
const isDevelopmentOtpPreviewEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.SHOW_DEV_OTP ?? "true") === "true";
const hasBrevoConfigured = Boolean(process.env.BREVO_API_KEY);
const hasEmailDeliveryConfigured = hasBrevoConfigured || Boolean(process.env.SMTP_HOST);
const hasTwilioConfigured = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
);
const hasSmsDeliveryConfigured =
  hasTwilioConfigured ||
  process.env.SMS_PROVIDER === "textbelt" ||
  Boolean(process.env.SMS_API_URL);

const resolveOtpChannel = (identifier = "", state = "") => {
  if (emailPattern.test(identifier)) {
    return "email";
  }

  return isSouthIndiaState(state) ? "email" : "mobile";
};

const buildFallbackUser = ({ identifier, name, image, state, isEmailOtp }) => {
  const existingUser = fallbackUsers.get(identifier);
  if (existingUser) {
    existingUser.state = state;
    existingUser.authMethod = isEmailOtp ? "email_otp" : "sms_otp";
    if (!existingUser.phone && !isEmailOtp) {
      existingUser.phone = identifier;
    }
    return existingUser;
  }

  const fallbackUser = {
    _id: `fallback-user-${fallbackUsers.size + 1}`,
    email: isEmailOtp ? identifier : `${identifier}@mobile.user`,
    name: name || "User",
    image,
    state,
    phone: isEmailOtp ? undefined : identifier,
    authMethod: isEmailOtp ? "email_otp" : "sms_otp",
    plan: "Free",
  };
  fallbackUsers.set(identifier, fallbackUser);
  return fallbackUser;
};

const sendEmailOtp = async (email, otp, state) => {
  const mailOptions = {
    from: process.env.OTP_FROM_EMAIL || "no-reply@yourtube.local",
    to: email,
    subject: "YourTube login verification code",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>State detected: ${state || "Unknown"}.</p><p>This code is valid for 5 minutes.</p>`,
  };

  try {
    if (hasBrevoConfigured) {
      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            email: mailOptions.from,
            name: "YourTube",
          },
          to: [{ email }],
          subject: mailOptions.subject,
          htmlContent: mailOptions.html,
          textContent: mailOptions.text,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo request failed with ${response.status}: ${errorBody}`);
      }

      return { delivered: true, provider: "brevo" };
    }

    if (!process.env.SMTP_HOST) {
      return { delivered: false, provider: "fallback", reason: "Email delivery is not configured." };
    }

    await transporter.sendMail(mailOptions);
    return { delivered: true, provider: "smtp" };
  } catch (error) {
    console.log("Email OTP fallback:", { mailOptions, error: String(error) });
    return { delivered: false, provider: hasBrevoConfigured ? "brevo" : "smtp", reason: String(error) };
  }
};

const sendMobileOtp = async (phone, otp, state) => {
  const message = `Your YourTube OTP is ${otp}. It is valid for 5 minutes. State detected: ${state || "Unknown"}.`;

  try {
    if (hasTwilioConfigured) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const payload = new URLSearchParams({
        To: phone,
        From: process.env.TWILIO_FROM_NUMBER,
        Body: message,
      });

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Twilio request failed with ${response.status}: ${errorBody}`);
      }

      return { delivered: true, provider: "twilio" };
    }

    if (process.env.SMS_PROVIDER === "textbelt") {
      const response = await fetch("https://textbelt.com/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          message,
          key: process.env.TEXTBELT_API_KEY || "textbelt",
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || `Textbelt request failed with ${response.status}`);
      }
      return { delivered: true, provider: "textbelt" };
    }

    if (process.env.SMS_API_URL) {
      const response = await fetch(process.env.SMS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SMS_API_KEY ? { Authorization: `Bearer ${process.env.SMS_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          phone,
          otp,
          state,
          message,
          senderId: process.env.SMS_SENDER_ID || "YourTube",
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS request failed with ${response.status}`);
      }
      return { delivered: true, provider: "custom" };
    }
  } catch (error) {
    console.log("SMS OTP fallback:", { phone, otp, state, message, error: String(error) });
    return {
      delivered: false,
      provider: hasTwilioConfigured ? "twilio" : process.env.SMS_PROVIDER || "custom",
      reason: String(error),
    };
  }

  console.log("SMS OTP fallback:", { phone, otp, state, message });
  return { delivered: false, provider: "fallback", reason: "SMS delivery is not configured." };
};

export const requestOTP = async (req, res) => {
  const { identifier, state } = req.body;
  const normalizedIdentifier = identifier?.trim();
  const normalizedState = normalizeState(state);
  const otpChannel = resolveOtpChannel(normalizedIdentifier, normalizedState);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Identifier is required." });
  }

  if (otpChannel === "email" && !emailPattern.test(normalizedIdentifier)) {
    return res.status(400).json({ message: "A valid email address is required to receive OTP." });
  }

  if (otpChannel === "mobile" && !phonePattern.test(normalizedIdentifier.replace(/[\s-]/g, ""))) {
    return res.status(400).json({ message: "A valid mobile number is required to receive OTP." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(normalizedIdentifier, {
    otp,
    state: normalizedState,
    channel: otpChannel,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  setTimeout(() => otpCache.delete(normalizedIdentifier), 5 * 60 * 1000);

  if (otpChannel === "email") {
    const deliveryResult = await sendEmailOtp(normalizedIdentifier, otp, normalizedState);
    console.log(`[EMAIL OTP] State: ${normalizedState}, To: ${normalizedIdentifier}, OTP: ${otp}`);
    return res.status(200).json({
      message: deliveryResult.delivered
        ? `OTP sent to your registered email address via ${deliveryResult.provider}.`
        : "OTP generated. Check the in-app OTP preview because email delivery is unavailable right now.",
      channel: otpChannel,
      state: normalizedState,
      deliveryFallback: !deliveryResult.delivered,
      provider: deliveryResult.provider,
      devOtp:
        isDevelopmentOtpPreviewEnabled || !deliveryResult.delivered || !hasEmailDeliveryConfigured
          ? otp
          : undefined,
    });
  }

  console.log(`[SMS OTP] State: ${normalizedState}, To: ${normalizedIdentifier}, OTP: ${otp}`);
  const deliveryResult = await sendMobileOtp(normalizedIdentifier, otp, normalizedState);
  return res.status(200).json({
    message: deliveryResult.delivered
      ? `OTP sent to your registered mobile number via ${deliveryResult.provider}.`
      : "OTP generated. Check the in-app OTP preview because SMS delivery is unavailable right now.",
    channel: otpChannel,
    state: normalizedState,
    deliveryFallback: !deliveryResult.delivered,
    provider: deliveryResult.provider,
    devOtp:
      isDevelopmentOtpPreviewEnabled || !deliveryResult.delivered || !hasSmsDeliveryConfigured
        ? otp
        : undefined,
  });
};

export const verifyOTP = async (req, res) => {
  const { identifier, otp, name, image, state } = req.body;
  const normalizedIdentifier = identifier?.trim();
  const otpRecord = otpCache.get(normalizedIdentifier);

  if (otpRecord && otpRecord.otp === otp && otpRecord.expiresAt > Date.now()) {
    otpCache.delete(normalizedIdentifier);

    try {
      const resolvedState = otpRecord.state || normalizeState(state);
      const isEmailOtp = otpRecord.channel === "email";
      if (!isDatabaseReady()) {
        const fallbackUser = buildFallbackUser({
          identifier: normalizedIdentifier,
          name,
          image,
          state: resolvedState,
          isEmailOtp,
        });

        return res.status(200).json({
          result: fallbackUser,
          channel: otpRecord.channel,
          state: resolvedState,
        });
      }

      let existingUser = await users.findOne(
        isEmailOtp ? { email: normalizedIdentifier } : { phone: normalizedIdentifier }
      );

      if (!existingUser) {
        const userData = {
          email: isEmailOtp ? normalizedIdentifier : `${normalizedIdentifier}@mobile.user`,
          name: name || "User",
          image,
          state: resolvedState,
          authMethod: isEmailOtp ? "email_otp" : "sms_otp",
        };
        if (!isEmailOtp) userData.phone = normalizedIdentifier;
        existingUser = await users.create(userData);
      } else {
        existingUser.state = resolvedState;
        existingUser.authMethod = isEmailOtp ? "email_otp" : "sms_otp";
        if (!existingUser.phone && !isEmailOtp) {
          existingUser.phone = normalizedIdentifier;
        }
        await existingUser.save();
      }

      res.status(200).json({
        result: existingUser,
        channel: otpRecord.channel,
        state: resolvedState,
      });
    } catch (error) {
      res.status(500).json({ message: "Error during user authentication" });
    }
  } else {
    res.status(400).json({ message: "Invalid or expired OTP" });
  }
};

export const login = async (req, res) => {

  const { email, name, image, state } = req.body;

  try {
    if (!isDatabaseReady()) {
      const existingFallbackUser = fallbackUsers.get(email);
      if (existingFallbackUser) {
        existingFallbackUser.state = normalizeState(state) || existingFallbackUser.state;
        existingFallbackUser.authMethod = "google";
        return res.status(200).json({ result: existingFallbackUser });
      }

      const fallbackUser = {
        _id: `fallback-user-${fallbackUsers.size + 1}`,
        email,
        name,
        image,
        state: normalizeState(state),
        authMethod: "google",
        plan: "Free",
      };
      fallbackUsers.set(email, fallbackUser);
      return res.status(201).json({ result: fallbackUser });
    }

    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({
        email,
        name,
        image,
        state: normalizeState(state),
        authMethod: "google",
      });
      return res.status(201).json({ result: newUser });
    } else {
      existingUser.state = normalizeState(state) || existingUser.state;
      existingUser.authMethod = "google";
      await existingUser.save();
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
