import express from "express";

import cartRoute from "./cart.route.js";
import courseRoute from "./course.route.js";
import orderRoute from "./order.route.js";
import paymentRoute from "./payment.route.js";
import profileRoute from "./profile.route.js";
import purchasedCourseRoute from "./purchasedCourse.route.js";
import userRoute from "./user.route.js";
import helpRoute from "./help.route.js";
import availabilityRoute from "./availability.route.js";
import bookingRoute from "./booking.route.js";
import reviewRoute from "./review.route.js";

import messageRoute from "./message.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/profile", profileRoute);
router.use("/messages", messageRoute);
router.use("/course", courseRoute);
router.use("/orders", orderRoute);
router.use("/payment", paymentRoute);
router.use("/purchased-courses", purchasedCourseRoute);
router.use("/cart", cartRoute);
router.use("/courses", courseRoute);
router.use("/help", helpRoute);
router.use("/availability", availabilityRoute);
router.use("/booking", bookingRoute);
router.use("/reviews", reviewRoute);

export default router;
