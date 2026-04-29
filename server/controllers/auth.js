import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import {
  getIceServers,
  hasStaticTurnConfig,
  hasSmtpConfig,
  mailDeliveryMode,
  hasTwilioClientConfig,
  hasTwilioConfig,
  isOtpPreviewEnabled,
  normalizePhoneNumber,
  sendMailMessage,
  sendSmsMessage,
  smsDeliveryMode,
} from "../lib/messaging.js";
import { getOtpChannelForState, resolveRequestGeo } from "../lib/geo.js";

const otpCache = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?\d{10,15}$/;

const normalizeState = (value = "") => value.trim();
const isLocalRuntime = process.env.NODE_ENV !== "production";
const shouldPreviewOtp = (deliveryConfigured) =>
  isOtpPreviewEnabled || (isLocalRuntime && !deliveryConfigured);

const sendEmailOtp = async (email, otp, state) => {
  return sendMailMessage({
    from: process.env.OTP_FROM_EMAIL || "no-reply@yourtube.local",
    to: email,
    subject: "YourTube login verification code",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>State detected: ${state || "Unknown"}.</p><p>This code is valid for 5 minutes.</p>`,
  });
};

const sendMobileOtp = async (mobile, otp, state) => {
  const smsBody = `YourTube OTP: ${otp}. Valid for 5 minutes. Region: ${state || "Unknown"}.`;
  return sendSmsMessage({
    to: mobile,
    body: smsBody,
  });
};

const getCachedOtpRecord = (identifier = "") => {
  const trimmedIdentifier = identifier.trim();
  const phoneIdentifier = normalizePhoneNumber(trimmedIdentifier);

  return (
    otpCache.get(trimmedIdentifier) ||
    (phoneIdentifier ? otpCache.get(phoneIdentifier) : null)
  );
};

export const getLocationContext = async (req, res) => {
  const geo = await resolveRequestGeo(req);
  return res.status(200).json({
    region: geo.region,
    city: geo.city,
    isSouthIndia: geo.isSouthIndia,
    channel: getOtpChannelForState(geo.region),
  });
};

export const getIceServerConfig = async (req, res) => {
  try {
    const iceServers = await getIceServers();
    return res.status(200).json({
      iceServers,
      relayConfigured: hasTwilioClientConfig || hasStaticTurnConfig,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch ICE server configuration.",
    });
  }
};

export const requestOTP = async (req, res) => {
  const { identifier } = req.body;
  const geo = await resolveRequestGeo(req);
  const normalizedState = normalizeState(geo.region);
  const otpChannel = getOtpChannelForState(normalizedState);
  const normalizedIdentifier = otpChannel === "mobile" ? normalizePhoneNumber(identifier || "") : identifier?.trim();

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Identifier is required." });
  }

  if (otpChannel === "email" && !emailPattern.test(normalizedIdentifier)) {
    return res.status(400).json({ message: "A valid email address is required for users in South India." });
  }

  if (otpChannel === "mobile" && !phonePattern.test(normalizedIdentifier.replace(/[\s-]/g, ""))) {
    return res.status(400).json({ message: "A valid mobile number is required for users outside South India." });
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
    const previewOtp = shouldPreviewOtp(mailDeliveryMode !== "mock");
    try {
      const mailResult = await sendEmailOtp(normalizedIdentifier, otp, normalizedState);
      if (mailDeliveryMode === "mock") {
        console.log("[EMAIL OTP MOCK TRANSPORT]", JSON.stringify(mailResult));
      }
    } catch (error) {
      console.log("Email OTP send failed:", error.message);
      if (!isOtpPreviewEnabled) {
        otpCache.delete(normalizedIdentifier);
        return res.status(502).json({ message: "Failed to send email OTP. Please try again." });
      }
    }

    if (previewOtp) {
      console.log(`[EMAIL OTP PREVIEW] State: ${normalizedState}, To: ${normalizedIdentifier}, OTP: ${otp}`);
    }
    return res.status(200).json({
      message: "OTP sent to your registered email address",
      channel: otpChannel,
      state: normalizedState,
      deliveryMode: mailDeliveryMode,
      devOtp: previewOtp ? otp : undefined,
    });
  }

  const previewOtp = shouldPreviewOtp(smsDeliveryMode !== "mock");
  try {
    await sendMobileOtp(normalizedIdentifier, otp, normalizedState);
  } catch (error) {
    console.log("SMS OTP send failed:", error.message);
    if (!isOtpPreviewEnabled) {
      otpCache.delete(normalizedIdentifier);
      return res.status(502).json({ message: "Failed to send SMS OTP. Please try again." });
    }
  }

  if (previewOtp) {
    console.log(`[SMS OTP PREVIEW] State: ${normalizedState}, To: ${normalizedIdentifier}, OTP: ${otp}`);
  }
  return res.status(200).json({
    message: "OTP sent to your registered mobile number",
    channel: otpChannel,
    state: normalizedState,
    deliveryMode: smsDeliveryMode,
    devOtp: previewOtp ? otp : undefined,
  });
};

export const verifyOTP = async (req, res) => {
  const { identifier, otp, name, image } = req.body;
  const otpRecord = getCachedOtpRecord(identifier || "");

  if (otpRecord && otpRecord.otp === otp && otpRecord.expiresAt > Date.now()) {
    const normalizedIdentifier =
      otpRecord.channel === "mobile"
        ? normalizePhoneNumber(identifier || "")
        : identifier?.trim();
    otpCache.delete(normalizedIdentifier);

    try {
      const resolvedState = otpRecord.state || "Unknown";
      const isEmailOtp = otpRecord.channel === "email";
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
  const geo = await resolveRequestGeo(req);
  const resolvedState = normalizeState(geo.region || state);

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({
        email,
        name,
        image,
        state: resolvedState,
        authMethod: "google",
      });
      return res.status(201).json({ result: newUser });
    } else {
      existingUser.state = resolvedState || existingUser.state;
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
