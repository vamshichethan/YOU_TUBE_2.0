import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../Modals/Auth.js";
import nodemailer from "nodemailer";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
  key_secret: process.env.RAZORPAY_SECRET || "mockSecretKey456"
});

// Mock Mailer Transport setup
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'mock_test@ethereal.email',
      pass: 'mock_password'
  }
});

const PLAN_PRICES = {
  Bronze: 1000,   // ₹10.00
  Silver: 5000,   // ₹50.00
  Gold: 10000     // ₹100.00
};

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
       return res.status(400).json({ message: "Invalid plan selected" });
    }

    const options = {
      amount: PLAN_PRICES[plan],
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString(36).substring(7),
    };
    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({ ...order, plan });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;
    
    // Validate signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET || "mockSecretKey456")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const user = await User.findById(userId);
      if(user) {
         user.plan = plan;
         await user.save();

         // Send Invoice Email via Nodemailer (Logged to console in Dev)
         console.log(`Sending Mock Email to ${user.email}`);
         const mailOptions = {
             from: '"YourTube Team" <billing@yourtube.com>',
             to: user.email,
             subject: `Your Receipt for YourTube ${plan}`,
             html: `
               <h2>Payment Successful!</h2>
               <p>Hi ${user.name || user.email},</p>
               <p>Thank you for upgrading to the <strong>${plan} Plan</strong>.</p>
               <hr/>
               <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
               <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
               <p><strong>Amount:</strong> ₹${(PLAN_PRICES[plan]/100).toFixed(2)}</p>
               <hr/>
               <p>Enjoy your newly upgraded viewing hours and features!</p>
             `
         };
         
         // Non-blocking send since this is a mock config that will fail real smtp
         try {
             transporter.sendMail(mailOptions).catch(err => console.log('Mock Email intercept:', mailOptions.html.replace(/\\n/g, ' ')));
         } catch(e) {}
      }

      res.status(200).json({ message: "Payment verified successfully", plan: plan });
    } else {
      res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
