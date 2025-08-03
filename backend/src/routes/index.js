import express from "express";

const router = express.Router();

// Mount all routes
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/payment", paymentRoutes);

export default router;
