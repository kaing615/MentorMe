// routes/profile.route.js
import express from "express";
import { validateBody } from "../middlewares/joi.middleware.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import { validateSearchMentors } from "../middlewares/validators/profile.middleware.js";
import upload from "../utils/multer.js";
import * as profileValidation from "../validations/profile.validation.js";

import profileController from "../controllers/profile.controller.js";
import parseSkillsMiddleware from "../middlewares/parseSkills.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/profile
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private (Cần authentication)
 */
router.get("/", tokenMiddleware.auth, profileController.getProfile);

/**
 * @route   GET /api/profile/mentor/:mentorId
 * @desc    Lấy thông tin profile của mentor theo ID
 * @access  Public
 */
router.get("/mentor/:mentorId", profileController.getMentorById);

/**
 * @route   GET /api/profile/top-mentors
 * @desc    Lấy danh sách top mentors
 * @access  Public
 */
router.get("/top-mentors", profileController.getTopMentors);

/**
 * @route   PUT /api/profile/mentor
 * @desc    Cập nhật thông tin profile cho mentor
 * @access  Private (Chỉ mentor)
 * @middleware Thứ tự: auth -> upload -> parseSkills -> validate -> controller
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
 * @middleware Thứ tự: auth -> upload -> validate -> controller
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
 * @middleware Thứ tự: auth -> upload -> controller
 */
router.put(
  "/avatar",
  tokenMiddleware.auth,
  upload.single("avatar"),
  profileController.changeAvatar
);

/**
 * @route   GET /api/profile/search/mentors
 * @desc    Tìm kiếm mentors theo các tiêu chí
 * @access  Public (Không cần authentication)
 * @query {String} [name] - Tìm theo tên mentor (firstName + lastName)
 * @query {String} [id] - Tìm theo user ID (exact match)
 * @query {String} [category] - Tìm theo danh mục/môn học
 * @query {String} [skills] - Tìm theo kỹ năng (comma separated)
 * @query {String} [location] - Tìm theo địa điểm
 * @query {Number} [page=1] - Số trang (pagination)
 * @query {Number} [limit=10] - Số lượng kết quả per page
 * @returns {Object} mentors, pagination, searchCriteria
 * @example GET /api/profile/search/mentors?name=john&category=technology&page=1&limit=5
 */
router.get(
  "/search/mentors",
  validateSearchMentors,
  profileController.searchMentors
);

export default router;
