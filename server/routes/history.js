import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
} from "../controllers/history.js";

const routes = express.Router();
routes.post("/views/:videoId", handleview);
routes.get("/:userId", getallhistoryVideo);
routes.post("/:videoId", handlehistory);
export default routes;
