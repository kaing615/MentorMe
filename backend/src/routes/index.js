import express from "express";

import courseRouter from "./course.route.js"
import userRoute from "./user.route.js"
import profileRoute from "./profile.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/courses", courseRouter); // Sửa từ "/course" thành "/courses"
router.use("/profile", profileRoute);

export default router;
