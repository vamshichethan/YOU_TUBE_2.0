import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  plan: { type: String, enum: ['Free', 'Bronze', 'Silver', 'Gold'], default: 'Free' },
  phone: { type: String },
  state: { type: String },
  authMethod: { type: String, enum: ["email_otp", "sms_otp", "google"], default: "email_otp" },
  subscribedChannels: { type: [String], default: [] },
});

export default mongoose.model("user", userschema);
