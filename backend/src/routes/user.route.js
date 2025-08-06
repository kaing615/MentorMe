import express from "express";
import { getUserCourses } from "../controllers/course.controller.js"; // Import hàm xử lý từ course.controller

const router = express.Router();

// Route để lấy danh sách khóa học của user
router.get("/users/:userId/courses", getUserCourses);

export default router;
