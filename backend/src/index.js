import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import bodyParser from "body-parser";
import multer from "multer";
import morgan from "morgan";
import http from "http";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import routes from "./routes/index.js";

dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Swagger YAML file
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Serve uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/v1", routes);

// Swagger UI setup  
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "MentorMe API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

app.get("/", (req, res) => {
  res.send(`
    <h1>Welcome to the MentorMe Backend!</h1>
    <p>Server is running successfully</p>
    <h2>📖 <a href="/api-docs" target="_blank">API Documentation (Swagger)</a></h2>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      h1 { color: #333; }
      h2 { color: #666; margin-top: 30px; }
      a { color: #007bff; text-decoration: none; }
      a:hover { text-decoration: underline; }
      p { color: #666; }
    </style>
  `);
});

mongoose
  .connect(process.env.MONGO_URL || 'mongodb://localhost:27017/mentorme')
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error: ", err);
    process.exit(1);
  });