import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";

// In-memory OTP storage (Identifier -> OTP)
const otpCache = new Map();

export const requestOTP = async (req, res) => {
  const { identifier, region } = req.body;
  const southIndiaStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
  const isSouthIndia = southIndiaStates.includes(region);
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(identifier, otp);
  
  // Set timeout to clear OTP after 5 minutes
  setTimeout(() => otpCache.delete(identifier), 5 * 60 * 1000);

  if (isSouthIndia) {
    // Send via Email (using mock transporter)
    console.log(`Region: ${region} (South India). Sending OTP to Email: ${identifier}`);
    
    // For demo, we just log the content and "send" it to console
    console.log(`[EMAIL OTP] To: ${identifier}, OTP: ${otp}`);
    res.status(200).json({ message: "OTP sent to your email address" });
  } else {
    // Send via Mobile (logging to console)
    console.log(`Region: ${region} (Outside South India). Sending OTP to Mobile: ${identifier}`);
    console.log(`[SMS OTP] To: ${identifier}, OTP: ${otp}`);
    res.status(200).json({ message: "OTP sent to your mobile number" });
  }
};

export const verifyOTP = async (req, res) => {
  const { identifier, otp, name, image } = req.body;
  
  const cachedOTP = otpCache.get(identifier);
  
  if (cachedOTP && cachedOTP === otp) {
    otpCache.delete(identifier);
    
    try {
      // Find or create user
      let existingUser = await users.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
      
      if (!existingUser) {
        const userData = { email: identifier.includes('@') ? identifier : `${identifier}@mobile.user`, name: name || "User", image };
        if (!identifier.includes('@')) userData.phone = identifier;
        existingUser = await users.create(userData);
      }
      
      res.status(200).json({ result: existingUser });
    } catch (error) {
      res.status(500).json({ message: "Error during user authentication" });
    }
  } else {
    res.status(400).json({ message: "Invalid or expired OTP" });
  }
};

export const login = async (req, res) => {

  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
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
