import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";

const SOUTH_INDIA_STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
const otpCache = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?\d{10,15}$/;

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
const isSouthIndiaState = (state = "") => SOUTH_INDIA_STATES.includes(normalizeState(state));
const isDevelopmentOtpPreviewEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.SHOW_DEV_OTP ?? "true") === "true";

const getOtpChannel = (state = "") => (isSouthIndiaState(state) ? "email" : "mobile");

const sendEmailOtp = async (email, otp, state) => {
  const mailOptions = {
    from: process.env.OTP_FROM_EMAIL || "no-reply@yourtube.local",
    to: email,
    subject: "YourTube login verification code",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>State detected: ${state || "Unknown"}.</p><p>This code is valid for 5 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Email OTP fallback:", mailOptions);
  }
};

export const requestOTP = async (req, res) => {
  const { identifier, state } = req.body;
  const normalizedIdentifier = identifier?.trim();
  const normalizedState = normalizeState(state);
  const otpChannel = getOtpChannel(normalizedState);

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
    await sendEmailOtp(normalizedIdentifier, otp, normalizedState);
    console.log(`[EMAIL OTP] State: ${normalizedState}, To: ${normalizedIdentifier}, OTP: ${otp}`);
    return res.status(200).json({
      message: "OTP sent to your registered email address",
      channel: otpChannel,
      state: normalizedState,
      devOtp: isDevelopmentOtpPreviewEnabled ? otp : undefined,
    });
  }

  console.log(`[SMS OTP] State: ${normalizedState}, To: ${normalizedIdentifier}, OTP: ${otp}`);
  return res.status(200).json({
    message: "OTP sent to your registered mobile number",
    channel: otpChannel,
    state: normalizedState,
    devOtp: isDevelopmentOtpPreviewEnabled ? otp : undefined,
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
