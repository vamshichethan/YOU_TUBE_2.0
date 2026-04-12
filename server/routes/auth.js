import express from "express";
import auth from "../middleware/auth.js";
import {
  login,
  updateprofile,
  requestOTP,
  verifyOTP,
  getSubscriptionStatus,
  toggleSubscription,
} from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/request-otp", requestOTP);
routes.post("/verify-otp", verifyOTP);
routes.patch("/update/:id", updateprofile);
routes.get("/subscription-status", auth, getSubscriptionStatus);
routes.post("/toggle-subscription", auth, toggleSubscription);
export default routes;
