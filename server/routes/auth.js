import express from "express";
import { login, updateprofile, requestOTP, verifyOTP } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/request-otp", requestOTP);
routes.post("/verify-otp", verifyOTP);
routes.patch("/update/:id", updateprofile);
export default routes;
