import express from "express";
import courseController from "../controllers/course.controller.js";
import courseMiddleware from "../middlewares/course.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import requestHandler from "../handlers/request.handler.js";

const router = express.Router();

// Routes công khai - không cần auth
router.get("/", courseController.getAllCourses); // Lấy tất cả khóa học
router.get("/:id", courseController.getCourseById); // Lấy chi tiết khóa học

// Routes cần auth
router.use(authMiddleware.verifyToken); // Áp dụng auth cho tất cả routes phía dưới

// Routes dành cho mentor
router.post(
  "/", 
  authMiddleware.requireMentorRole,
  courseMiddleware.createCourseValidator,
  requestHandler.validate,
  courseController.createCourse
);

router.get(
  "/my/courses",
  authMiddleware.requireMentorRole,
  courseController.getMyCourses
);

router.put(
  "/:id",
  authMiddleware.requireMentorRole,
  courseMiddleware.updateCourseValidator,
  requestHandler.validate,
  courseController.updateCourse
);

router.delete(
  "/:id",
  authMiddleware.requireMentorRole,
  courseController.deleteCourse
);

export default router;
