import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import paymentroutes from "./routes/payment.js";
import downloadroutes from "./routes/download.js";
dotenv.config();
const app = express();
import path from "path";
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/payment", paymentroutes);
app.use("/download", downloadroutes);
const PORT = process.env.PORT || 5000;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("offer", (payload) => {
      socket.to(roomId).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
      socket.to(roomId).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload) => {
      socket.to(roomId).emit("ice-candidate", payload);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const connectDatabase = async () => {
  const configuredDbUrl = process.env.DB_URL;
  const shouldUseMemoryMongo =
    process.env.USE_MEMORY_MONGO === "true" ||
    !configuredDbUrl ||
    configuredDbUrl.includes("localhost") ||
    configuredDbUrl.includes("127.0.0.1");

  try {
    if (shouldUseMemoryMongo) {
      const memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri("yourtube");
      await mongoose.connect(memoryUri);
      console.log("MongoDB connected using in-memory fallback");
      return;
    }

    await mongoose.connect(configuredDbUrl);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Database connection failed", error);
  }
};

connectDatabase();
