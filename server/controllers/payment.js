import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../Modals/Auth.js";
import nodemailer from "nodemailer";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
  key_secret: process.env.RAZORPAY_SECRET || "mockSecretKey456"
});
const usingMockRazorpay = (process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123").includes("mock");

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

const PLAN_PRICES = {
  Bronze: 1000,   // ₹10.00
  Silver: 5000,   // ₹50.00
  Gold: 10000     // ₹100.00
};

const PLAN_LIMITS = {
  Free: "5 minutes",
  Bronze: "7 minutes",
  Silver: "10 minutes",
  Gold: "Unlimited",
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
      notes: {
        plan,
        watchLimit: PLAN_LIMITS[plan],
      },
    };
    const order = usingMockRazorpay
      ? {
          id: `order_mock_${Date.now()}`,
          entity: "order",
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency,
          receipt: options.receipt,
          status: "created",
          attempts: 0,
          notes: options.notes,
          created_at: Math.floor(Date.now() / 1000),
        }
      : await razorpayInstance.orders.create(options);
    res.status(200).json({
      ...order,
      plan,
      planPrice: PLAN_PRICES[plan],
      watchLimit: PLAN_LIMITS[plan],
      mockMode: usingMockRazorpay,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }
    
    // Validate signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET || "mockSecretKey456")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.plan = plan;
      await user.save();

      const invoiceDate = new Date();
      const invoiceId = `INV-${invoiceDate.getTime()}`;
      const amountInRupees = (PLAN_PRICES[plan] / 100).toFixed(2);
      const invoiceDetails = {
        invoiceId,
        invoiceDate: invoiceDate.toISOString(),
        plan,
        amount: amountInRupees,
        currency: "INR",
        watchLimit: PLAN_LIMITS[plan],
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        customerEmail: user.email,
      };

      const mailOptions = {
        from: process.env.OTP_FROM_EMAIL || '"YourTube Team" <billing@yourtube.com>',
        to: user.email,
        subject: `YourTube Invoice ${invoiceId} for ${plan} Plan`,
        text: `Invoice ${invoiceId}\nPlan: ${plan}\nAmount: INR ${amountInRupees}\nWatch time: ${PLAN_LIMITS[plan]}\nOrder ID: ${razorpay_order_id}\nPayment ID: ${razorpay_payment_id}`,
        html: `
          <h2>Payment Successful</h2>
          <p>Hi ${user.name || user.email},</p>
          <p>Your YourTube subscription has been upgraded successfully.</p>
          <hr />
          <p><strong>Invoice ID:</strong> ${invoiceId}</p>
          <p><strong>Invoice Date:</strong> ${invoiceDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Amount:</strong> INR ${amountInRupees}</p>
          <p><strong>Watch Time:</strong> ${PLAN_LIMITS[plan]}</p>
          <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <hr />
          <p>Thanks for upgrading your viewing experience.</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.log("Invoice email fallback:", mailOptions);
      }

      res.status(200).json({
        message: "Payment verified successfully",
        plan,
        invoice: invoiceDetails,
      });
    } else {
      res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
