// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import routes from "./routes/index.js";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";
import attachSocket from "./socket/index.js"; // Import socket functionality

// ⬇️ THÊM CÁC IMPORT THIẾU CHO ESM
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (_req, res) => {
  res.send("Welcome to the MentorMe backend!");
});

const server = http.createServer(app);

// Attach Socket.IO to the server
const io = attachSocket(server);
console.log("🔌 Socket.IO server initialized");

mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/mentorme")
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });