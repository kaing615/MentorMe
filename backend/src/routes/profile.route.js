import express from "express";
import { validateBody } from "../middlewares/joi.middleware.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import upload from "../utils/multer.js";
import * as profileValidation from "../validations/profile.validation.js";

import profileController from "../controllers/profile.controller.js";
import parseSkillsMiddleware from "../middlewares/parseSkills.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/profile/
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private (Cần authentication)
 * @middleware tokenMiddleware.auth - Xác thực JWT token
 * @returns {Object} user, profile - Thông tin user và profile đã được làm sạch
 */
router.get("/", tokenMiddleware.auth, profileController.getProfile);

/**
 * @route   PUT /api/profile/mentor
 * @desc    Cập nhật thông tin profile cho mentor
 * @access  Private (Chỉ mentor)
 * @middleware tokenMiddleware.auth - Xác thực JWT token
 * @middleware upload.single('avatar') - Upload avatar (optional)
 * @middleware parseSkillsMiddleware - Parse skills từ string thành array
 * @middleware validateBody(updateMentorProfileSchema) - Joi validation cho mentor profile
 * @body {String} userName - Tên người dùng (required)
 * @body {String} firstName - Họ (required)
 * @body {String} lastName - Tên (required)
 * @body {String} jobTitle - Chức danh (required)
 * @body {String} category - Danh mục (required)
 * @body {String} bio - Tiểu sử (required)
 * @body {String} mentorReason - Lý do làm mentor (required)
 * @body {String} [location] - Địa điểm (optional)
 * @body {Array} [skills] - Kỹ năng (optional)
 * @body {String} [greatestAchievement] - Thành tựu lớn nhất (optional)
 * @body {String} [headline] - Tiêu đề (optional)
 * @body {String} [experience] - Kinh nghiệm (optional)
 * @body {String} [introVideo] - Video giới thiệu (optional)
 * @body {Array} [languages] - Ngôn ngữ (optional)
 * @body {String} [timezone] - Múi giờ (optional)
 * @body {Object} [links] - Các link mạng xã hội (optional)
 * @files {File} [avatar] - Ảnh đại diện (optional)
 * @returns {Object} message, user, profile - Thông tin đã cập nhật
 */
router.put(
  "/mentor",
  tokenMiddleware.auth,
  upload.single("avatar"),
  parseSkillsMiddleware,
  validateBody(profileValidation.updateMentorProfileSchema),
  profileController.updateMentorProfile
);

/**
 * @route   PUT /api/profile/mentee
 * @desc    Cập nhật thông tin profile cho mentee
 * @access  Private (Chỉ mentee)
 * @middleware tokenMiddleware.auth - Xác thực JWT token
 * @middleware upload.single('avatar') - Upload avatar (optional)
 * @middleware validateBody(updateMenteeProfileSchema) - Joi validation cho mentee profile
 * @body {String} userName - Tên người dùng (required)
 * @body {String} firstName - Họ (required)
 * @body {String} lastName - Tên (required)
 * @body {String} [bio] - Tiểu sử (optional)
 * @body {String} [location] - Địa điểm (optional)
 * @body {String} [description] - Mô tả bản thân (optional)
 * @body {String} [goal] - Mục tiêu (optional)
 * @body {String} [education] - Học vấn (optional)
 * @body {Array} [languages] - Ngôn ngữ (optional)
 * @body {String} [timezone] - Múi giờ (optional)
 * @body {Object} [links] - Các link mạng xã hội (optional)
 * @files {File} [avatar] - Ảnh đại diện (optional)
 * @returns {Object} message, user, profile - Thông tin đã cập nhật
 */
router.put(
  "/mentee",
  tokenMiddleware.auth,
  upload.single("avatar"),
  validateBody(profileValidation.updateMenteeProfileSchema),
  profileController.updateMenteeProfile
);

/**
 * @route   PUT /api/profile/avatar
 * @desc    Thay đổi avatar của user
 * @access  Private (Cần authentication)
 * @middleware tokenMiddleware.auth - Xác thực JWT token
 * @middleware upload.single('avatar') - Upload avatar (required)
 * @files {File} avatar - File ảnh đại diện (required)
 * @returns {Object} message, avatarUrl - URL avatar mới
 */
router.put(
  "/avatar",
  tokenMiddleware.auth,
  upload.single("avatar"),
  profileController.changeAvatar
);

export default router;
