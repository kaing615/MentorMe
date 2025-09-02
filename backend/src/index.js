// backend/src/index.js
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import cleanupOldAvailabilities from "./jobs/cleanupOldAvailabilities.job.js";
import routes from "./routes/index.js";

// ⬇️ THÊM CÁC IMPORT THIẾU CHO ESM
import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

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
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1, // Ẩn toàn bộ "Schemas" dưới cùng
      defaultModelExpandDepth: -1, // (tuỳ chọn) không mở chi tiết model
      docExpansion: "none", // (tuỳ chọn) thu gọn toàn bộ endpoint
    },
  })
);

app.get("/", (_req, res) => {
  res.send("Welcome to the MentorMe backend!");
});

const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/mentorme")
  .then(() => {
    console.log("MongoDB connected");

    // Start cleanup job sau khi DB connected
    cleanupOldAvailabilities.start();
    console.log(
      "🕒 Old availability cleanup job started (runs daily at 00:01)"
    );

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(
        `📖 API Documentation available at http://localhost:${PORT}/api-docs`
      );
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, stopping cleanup job...");
  cleanupOldAvailabilities.destroy();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, stopping cleanup job...");
  cleanupOldAvailabilities.destroy();
  process.exit(0);
});
