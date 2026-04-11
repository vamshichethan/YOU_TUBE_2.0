import express from "express";
import { getDownloads, requestDownload } from "../controllers/download.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/getall", auth, getDownloads);
router.post("/request", auth, requestDownload);

export default router;
