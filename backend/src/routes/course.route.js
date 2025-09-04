import express from "express";
import * as CourseCtl from "../controllers/course.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.middleware.js";
import upload from "../utils/multer.js";
import {
  createCourseSchema,
  updateCourseSchema,
  addMentorSchema,
  addContentSchema,
  addReviewSchema,
} from "../validations/course.validation.js";
import courseController from "../controllers/course.controller.js";
import { validateBody } from "../middlewares/joi.middleware.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as courseValidation from "../validations/course.validation.js";

const router = express.Router();

// Gộp cả named exports và default export (nếu có)
const C = { ...CourseCtl, ...(CourseCtl.default || {}) };

// Báo lỗi sớm nếu thiếu handler nào (đỡ “argument handler must be a function”)
[
  "getRelatedCourses",
  "getCoursesByMentor",
  "getCourses",
  "getCourseById",
  "getMyCourses",
  "createCourse",
  "updateCourse",
  "deleteCourse",
  "addCourseReview",
  "getCourseReviews",
  "addMentorToCourse",
  "removeMentorFromCourse",
  "addContentToCourse",
  "removeContentFromCourse",
].forEach((name) => {
  if (typeof C[name] !== "function") {
    throw new Error(
      `controllers/course.controller.js is missing exported function: ${name}`
    );
  }
});

// Joi -> middleware
const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const payload = { ...req.body, ...req.params, ...req.query };
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation error", details: error.details });
  }
  req.body = { ...req.body, ...value };
  next();
};

/** ========= PUBLIC ========= */
router.get("/related", C.getRelatedCourses);
router.get("/mentor/:mentorId", C.getCoursesByMentor);
router.get("/reviews", C.getAllReviews);
router.get("/", C.getCourses);

/** ========= AUTHED / ROLE ========= */
// Danh sách khoá học của chính mentor đang đăng nhập
router.get(
  "/my-courses",
  verifyToken,
  authorizeRoles("mentor"),
  C.getMyCourses
);

// Route with params must be last
router.get("/:courseId", C.getCourseById);

// Tạo khoá học (mentor/admin)
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
  verifyToken,
  upload?.single ? upload.single("thumbnail") : upload,
  validate(createCourseSchema),
  authorizeRoles("mentor", "admin"),
  C.createCourse
);

// Cập nhật khoá học
router.put(
  "/:courseId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  upload?.single ? upload.single("thumbnail") : upload,
  validate(updateCourseSchema),
  C.updateCourse
);

// Xoá khoá học
router.delete(
  "/:courseId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  C.deleteCourse
);

// Đánh giá khoá học
router.post(
  "/:courseId/reviews",
  verifyToken,
  validate(addReviewSchema),
  C.addCourseReview
);
router.get("/:courseId/reviews", C.getCourseReviews);

// Thêm / xoá mentor của khoá
router.post(
  "/:courseId/mentors",
  verifyToken,
  authorizeRoles("admin"),
  validate(addMentorSchema),
  C.addMentorToCourse
);
router.delete(
  "/:courseId/mentors/:mentorId",
  verifyToken,
  authorizeRoles("admin"),
  C.removeMentorFromCourse
);

// Thêm / xoá content của khoá
router.post(
  "/:courseId/content",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  validate(addContentSchema),
  C.addContentToCourse
);
router.delete(
  "/:courseId/content/:contentId",
  verifyToken,
  authorizeRoles("mentor", "admin"),
  C.removeContentFromCourse
  tokenMiddleware.auth,
  validateBody(courseValidation.createCourseSchema),
  courseController.createCourse
);

export default router;