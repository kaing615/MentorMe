import express from "express";
import purchasedCourseController from "../controllers/purchasedCourse.controller.js";
import { validateBody } from "../middlewares/joi.middleware.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import * as userValidation from "../validations/user.validation.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(tokenMiddleware.auth);

/**
 * @route   GET /api/purchased-courses
 * @desc    Lấy danh sách khóa học đã mua của user
 * @access  Private
 * @returns {Object} data - Danh sách khóa học đã mua với thông tin chi tiết
 */
router.get("/", purchasedCourseController.getPurchasedCourses);

/**
 * @route   GET /api/purchased-courses/stats
 * @desc    Lấy thống kê học tập của user
 * @access  Private
 * @returns {Object} data - Thống kê tổng quan về tiến độ học tập
 */
router.get("/stats", purchasedCourseController.getLearningStats);

/**
 * @route   GET /api/purchased-courses/check/:courseId
 * @desc    Kiểm tra xem user đã mua khóa học này chưa
 * @access  Private
 * @params {String} courseId - ID của khóa học cần kiểm tra
 * @returns {Object} isPurchased, courseData - Trạng thái mua hàng và thông tin khóa học
 */
router.get("/check/:courseId", purchasedCourseController.checkCoursePurchase);

/**
 * @route   PUT /api/purchased-courses/:courseId/progress
 * @desc    Cập nhật tiến độ học khóa học
 * @access  Private
 * @middleware validateBody(courseProgressSchema) - Joi validation cho progress
 * @params {String} courseId - ID của khóa học
 * @body {Number} progress - Tiến độ học từ 0-100%
 * @returns {Object} data - Thông tin tiến độ đã cập nhật
 */
router.put(
  "/:courseId/progress",
  validateBody(userValidation.courseProgressSchema),
  purchasedCourseController.updateCourseProgress
);

/**
 * @route   POST /api/purchased-courses/purchase-success
 * @desc    Xử lý khi thanh toán thành công - tự động thêm courses từ order
 * @access  Private
 * @middleware validateBody(purchaseSuccessSchema) - Joi validation cho orderId
 * @body {String} orderId - ID của đơn hàng đã thanh toán
 * @returns {Object} message, coursesAdded count
 */
router.post(
  "/purchase-success",
  validateBody(userValidation.purchaseSuccessSchema),
  purchasedCourseController.handlePurchaseSuccess
);

export default router;
