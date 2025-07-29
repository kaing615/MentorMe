import express from "express";
import token from "../middlewares/token.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import userRoute from "./user.route.js";
import courseRoutes from "./course.route.js"; // Import course routes

const router = express.Router();

router.use("/user", userRoute);

// Use course routes
router.use(courseRoutes);

export default router;
