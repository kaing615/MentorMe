import express from "express";

import courseController from "../controllers/course.controller.js";
import requestHandler from "../handlers/request.handler.js";

const router = express.Router();

router.get(
    "/",
    courseController.getCourses,
);

router.get(
    "/related",
    courseController.getRelatedCourses,
);

router.get(
    "/:id",
    courseController.getCourseById,
);

export default router;