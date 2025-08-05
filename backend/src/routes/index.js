import express from "express";
import token from "../middlewares/token.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import userRoute from "./user.route.js"

import userRoute from "./user.route.js";
import courseRoute from "./course.route.js";
import createCourseRoute from "./createcourse.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/courses", courseRoute);
router.use("/create-course", createCourseRoute);

export default router;
