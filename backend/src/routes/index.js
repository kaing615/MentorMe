import express from "express";

import availabilityRoute from "./availability.route.js";
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
router.use("/courses", courseRoute);
router.use("/availability", availabilityRoute);

export default router;
