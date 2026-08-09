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

export const routeMounts = [
  { path: "/user", router: userRoute },
  { path: "/profile", router: profileRoute },
  { path: "/messages", router: messageRoute },
  { path: "/course", router: courseRoute },
  { path: "/courses", router: courseRoute },
  { path: "/orders", router: orderRoute },
  { path: "/payment", router: paymentRoute },
  { path: "/purchased-courses", router: purchasedCourseRoute },
  { path: "/cart", router: cartRoute },
  { path: "/help", router: helpRoute },
  { path: "/availability", router: availabilityRoute },
  { path: "/booking", router: bookingRoute },
  { path: "/reviews", router: reviewRoute },
];

const router = express.Router();

for (const mount of routeMounts) {
  router.use(mount.path, mount.router);
}

export default router;
