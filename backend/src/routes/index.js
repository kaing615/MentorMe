import express from "express";

import profileRoute from "./profile.route.js";
import userRoute from "./user.route.js";

const router = express.Router();

router.use("/user", userRoute);
router.use("/profile", profileRoute);

export default router;
