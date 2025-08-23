import express from "express";
<<<<<<< HEAD

const router = express.Router();

// Import all route files here
=======

import cartRoute from "./cart.route.js";
import courseRoute from "./course.route.js";
import profileRoute from "./profile.route.js";
import purchasedCourseRoute from "./purchasedCourse.route.js";
import userRoute from "./user.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/profile", profileRoute);
router.use("/course", courseRoute);
router.use("/purchased-courses", purchasedCourseRoute);
router.use("/cart", cartRoute);
>>>>>>> 0e92a0b1b0aa6b6f0df3f429a0d7adecbc27d9a5

export default router;
