import express from "express";

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

// Add reviews endpoint
router.get("/reviews", async (req, res) => {
  const { getAllReviews } = await import("../controllers/course.controller.js");
  return getAllReviews(req, res);
});

export default router;
