import express from "express";
import userRoutes from "./user.route.js";
import courseRoutes from "./course.route.js";
import cartRoutes from "./cart.route.js";
import checkoutRoutes from "./checkout.route.js";
import orderRoutes from "./order.route.js";
import paymentRoutes from "./payment.route.js";

const router = express.Router();

// Mount all routes
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/payment", paymentRoutes);

export default router;
