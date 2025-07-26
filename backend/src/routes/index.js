import express from "express";
import userRoutes from "./user.route.js";
import courseRoutes from "./course.route.js"; // Import course routes

const router = express.Router();

// Use user routes
router.use(userRoutes);

// Use course routes
router.use(courseRoutes);

export default router;
