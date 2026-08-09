import dotenv from "dotenv";
import { startServer } from "./server.js";

dotenv.config();

startServer().catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
