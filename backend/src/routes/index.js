import express from "express";
import token from "../middlewares/token.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import userRoute from "./user.route.js";
import courseRoutes from "./course.route.js"; // Import course routes


const router = express.Router();

router.use("/user", userRoute);

// Use course routes directly (already mounted at /api/v1 in main index.js)
router.use("/courses", courseRoutes);


export default router;
