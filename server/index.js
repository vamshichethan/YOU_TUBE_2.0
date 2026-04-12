import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.join(__dirname, "uploads");

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
  process.env.ALLOWED_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOriginPatterns = [
  /^http:\/\/localhost(?::\d+)?$/i,
  /^https:\/\/(?:.+\.)?vercel\.app$/i,
];

const isOriginAllowed = (origin) =>
  configuredOrigins.includes(origin) ||
  allowedOriginPatterns.some((pattern) => pattern.test(origin));

app.use(cors({
  origin(origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(uploadsDirectory));
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
  const isLocalDatabaseTarget =
    !configuredDbUrl ||
    configuredDbUrl.includes("localhost") ||
    configuredDbUrl.includes("127.0.0.1");
  const shouldUseMemoryMongo =
    process.env.USE_MEMORY_MONGO === "true" &&
    process.env.NODE_ENV !== "production";

  try {
    if (shouldUseMemoryMongo) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri("yourtube");
      await mongoose.connect(memoryUri);
      console.log("MongoDB connected using in-memory fallback");
      return;
    }

    if (isLocalDatabaseTarget) {
      console.warn(
        "Skipping database connection because no production-ready DB_URL is configured. API fallback data will be used."
      );
      return;
    }

    await mongoose.connect(configuredDbUrl);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Database connection failed", error);
  }
};

connectDatabase();
