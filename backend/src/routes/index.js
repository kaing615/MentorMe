import express from "express";
import token from "../middlewares/token.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import userRoute from "./user.route.js";
import courseRoute from "./course.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/courses", courseRoute);

// Add reviews endpoint
router.get("/reviews", async (req, res) => {
  const { getAllReviews } = await import("../controllers/course.controller.js");
  return getAllReviews(req, res);
});

export default router;
