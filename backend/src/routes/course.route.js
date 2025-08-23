import express from "express";
import courseController from "../controllers/course.controller.js";
import { validateBody } from "../middlewares/joi.middleware.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as courseValidation from "../validations/course.validation.js";

const router = express.Router();

/**
 * @route   GET /api/course
 * @desc    Lấy tất cả khóa học với filter và search
 * @access  Public
 * @query {Number} page - Số trang (default: 1)
 * @query {Number} limit - Số lượng mỗi trang (default: 10)
 * @query {String} category - Lọc theo danh mục
 * @query {String} mentor - Lọc theo mentor ID
 * @query {String} search - Tìm kiếm theo title hoặc description
 * @returns {Object} courses, pagination info
 */
router.get("/", courseController.getCourses);

/**
 * @route   GET /api/course/:id
 * @desc    Lấy chi tiết khóa học
 * @access  Public
 * @params {String} id - ID của khóa học
 * @returns {Object} course detail với mentor và mentees info
 */
router.get("/:id", courseController.getCourseById);

/**
 * @route   GET /api/course/mentor/:mentorId
 * @desc    Lấy danh sách khóa học theo mentor
 * @access  Public
 * @params {String} mentorId - ID của mentor
 * @query {Number} page - Số trang (default: 1)
 * @query {Number} limit - Số lượng mỗi trang (default: 10)
 * @returns {Object} courses của mentor, pagination info
 */
router.get("/mentor/:mentorId", courseController.getCoursesByMentor);

/**
 * @route   POST /api/course
 * @desc    Tạo khóa học mới (chỉ mentor)
 * @access  Private (Mentor only)
 * @middleware tokenMiddleware.auth - Xác thực JWT token
 * @middleware validateBody(createCourseSchema) - Joi validation cho course
 * @body {String} title - Tiêu đề khóa học
 * @body {String} description - Mô tả khóa học
 * @body {Number} price - Giá khóa học
 * @body {String} category - Danh mục
 * @body {Array} tags - Các tag
 * @body {Number} duration - Thời lượng (phút)
 * @body {String} link - Link khóa học
 * @body {Number} lectures - Số bài giảng
 * @returns {Object} course info
 */
router.post(
  "/",
  tokenMiddleware.auth,
  validateBody(courseValidation.createCourseSchema),
  courseController.createCourse
);

export default router;
