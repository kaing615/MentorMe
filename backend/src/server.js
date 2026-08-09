import http from "http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import attachSocket from "./socket/index.js";

export const startServer = async () => {
  const app = createApp();
  const server = http.createServer(app);
  const io = attachSocket(server);
  const port = process.env.PORT || 4000;

  await mongoose.connect(
    process.env.MONGO_URL || "mongodb://localhost:27017/mentorme"
  );

  await new Promise((resolve) => server.listen(port, resolve));

  console.log("MongoDB connected");
  console.log("Socket.IO server initialized");
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);

  return { app, server, io };
};

export default startServer;
