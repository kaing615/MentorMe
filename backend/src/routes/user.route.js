import express from "express";
import { validateBody } from "../middlewares/joi.middleware.js";
import upload from "../utils/multer.js";
import * as userValidation from "../validations/user.validation.js";

import userController from "../controllers/user.controller.js";
import parseSkillsMiddleware from "../middlewares/parseSkills.middleware.js";

const router = express.Router();

/**
 * @route   POST /api/user/signup
 * @desc    Đăng ký tài khoản user thông thường (mentee)
 * @access  Public
 * @middleware validateBody(signUpSchema) - Joi validation cho signup
 * @body {String} firstName - Họ (required)
 * @body {String} lastName - Tên (required)
 * @body {String} email - Email (required, unique)
 * @body {String} password - Mật khẩu (required, min 6 chars)
 * @body {String} confirmPassword - Xác nhận mật khẩu (required)
 * @body {String} userName - Tên người dùng (required)
 * @returns {Object} message - Thông báo gửi email xác thực
 */
router.post(
  "/signup",
  validateBody(userValidation.signUpSchema),
  userController.signUp
);

/**
 * @route   POST /api/user/signupMentor
 * @desc    Đăng ký tài khoản mentor với thông tin đầy đủ
 * @access  Public
 * @middleware upload.single('avatar') - Upload avatar (required)
 * @middleware parseSkillsMiddleware - Parse skills từ string thành array
 * @middleware validateBody(signUpMentorSchema) - Joi validation cho signup mentor
 * @body {String} firstName - Họ (required)
 * @body {String} lastName - Tên (required)
 * @body {String} email - Email (required, unique)
 * @body {String} password - Mật khẩu (required, min 6 chars)
 * @body {String} confirmPassword - Xác nhận mật khẩu (required)
 * @body {String} userName - Tên người dùng (required)
 * @body {String} jobTitle - Chức danh (required)
 * @body {String} location - Địa điểm (required)
 * @body {String} category - Danh mục (required)
 * @body {Array} skills - Kỹ năng (required)
 * @body {String} bio - Tiểu sử (required)
 * @body {Object} [links] - Social links (optional)
 * @body {String} mentorReason - Lý do làm mentor (required)
 * @body {String} greatestAchievement - Thành tựu lớn nhất (required)
 * @files {File} avatar - Ảnh đại diện (required)
 * @returns {Object} message, id, avatarUrl - Thông tin đăng ký thành công
 */
router.post(
  "/signupMentor",
  upload.single("avatar"),
  parseSkillsMiddleware,
  validateBody(userValidation.signUpMentorSchema),
  userController.signUpMentor
);

/**
 * @route   POST /api/user/signin
 * @desc    Đăng nhập vào hệ thống
 * @access  Public
 * @middleware validateBody(signInSchema) - Joi validation cho signin
 * @body {String} email - Email (required)
 * @body {String} password - Mật khẩu (required)
 * @returns {Object} token, user - JWT token và thông tin user
 */
router.post(
  "/signin",
  validateBody(userValidation.signInSchema),
  userController.signIn
);

/**
 * @route   GET /api/user/verify
 * @desc    Xác thực email thông qua link trong email
 * @access  Public
 * @query {String} email - Email cần xác thực
 * @query {String} verifyKey - Verification key từ email
 * @returns {Object} message, token, user - Xác thực thành công và auto login
 */
router.get("/verify", userController.verifyEmail);

/**
 * @route   POST /api/user/resend-verification-email
 * @desc    Gửi lại email xác thực cho user chưa verify
 * @access  Public
 * @middleware validateBody(resendEmailSchema) - Joi validation cho resend email
 * @body {String} email - Email cần gửi lại verification
 * @returns {Object} message - Thông báo gửi email thành công
 */
router.post(
  "/resend-verification-email",
  validateBody(userValidation.resendEmailSchema),
  userController.resendVerificationEmail
);

/**
 * @route   POST /api/user/forgot-password
 * @desc    Gửi email reset password cho user quên mật khẩu
 * @access  Public
 * @middleware validateBody(forgotPasswordSchema) - Joi validation cho forgot password
 * @body {String} email - Email cần reset password
 * @returns {Object} message - Thông báo gửi email reset (không tiết lộ email tồn tại)
 */
router.post(
  "/forgot-password",
  validateBody(userValidation.forgotPasswordSchema),
  userController.forgotPassword
);

/**
 * @route   POST /api/user/reset-password
 * @desc    Đặt lại mật khẩu mới thông qua reset token
 * @access  Public
 * @middleware validateBody(resetPasswordSchema) - Joi validation cho reset password
 * @body {String} email - Email cần reset
 * @body {String} token - Reset token từ email
 * @body {String} newPassword - Mật khẩu mới
 * @returns {Object} message - Thông báo reset thành công
 */
router.post(
  "/reset-password",
  validateBody(userValidation.resetPasswordSchema),
  userController.resetPassword
);

export default router;
