import express from "express";
import token from "../middlewares/token.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import courseRouter from "./course.route.js"
import userRoute from "./user.route.js"

const router = express.Router();

router.use("/user", userRoute);
router.use("/course",courseRouter);

export default router;
