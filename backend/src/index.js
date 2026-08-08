import dotenv from "dotenv";
import startServer from "./server.js";

dotenv.config();

startServer().catch((error) => {
  console.error("MentorMe failed to start", error);
  process.exitCode = 1;
});
