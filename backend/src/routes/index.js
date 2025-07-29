import express from "express";
import courseRoutes from "./course.routes.js";

const router = express.Router();

// Import all route files here
router.use("/courses", courseRoutes);

export default router;
