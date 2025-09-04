import express from "express";
import { validateBody } from "../middlewares/joi.middleware.js";
import upload from "../utils/multer.js";

import {
  signUpSchema,
  signUpMentorSchema,
  signInSchema,
  verifyEmailSchema,
  resendEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/user.validation.js";
import * as userValidation from "../validations/user.validation.js";

import userController from "../controllers/user.controller.js";
import parseFieldsMiddleware from "../middlewares/parseFields.middleware.js";

const router = express.Router();

// Gộp cả named lẫn default export để không bị undefined
const U = { ...UserCtl, ...(UserCtl.default || {}) };

// Joi -> middleware validate
const validate = (schema) => (req, res, next) => {
  if (!schema) return next();
  const src = req.method === "GET" ? { ...req.query, ...req.params } : { ...req.body, ...req.params, ...req.query };
  const { error, value } = schema.validate(src, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({ message: "Validation error", details: error.details });
  }
  // Không thể gán trực tiếp req.query vì nó là read-only
  // Thay vào đó ta sẽ tạo property mới hoặc gán từng property
  if (req.method === "GET") {
    req.validatedQuery = value;
  } else {
    req.body = value;
  }
  next();
};

// ===== PUBLIC AUTH =====
if (typeof U.signUp !== "function") throw new Error("user.controller.js is missing: signUp");
if (typeof U.signIn !== "function") throw new Error("user.controller.js is missing: signIn");
if (typeof U.signUpMentor !== "function") throw new Error("user.controller.js is missing: signUpMentor");

router.post("/signup", validate(signUpSchema), U.signUp);
router.post("/signin", validate(signInSchema), U.signIn);
router.post("/signupMentor", upload.single("avatar"), validate(signUpMentorSchema), U.signUpMentor);

if (typeof U.verifyEmail === "function")
  router.get("/verify", validate(verifyEmailSchema), U.verifyEmail);

if (typeof U.resendEmail === "function")
  router.post("/resend-email", validate(resendEmailSchema), U.resendEmail);

if (typeof U.forgotPassword === "function")
  router.post("/forgot-password", validate(forgotPasswordSchema), U.forgotPassword);

if (typeof U.resetPassword === "function")
  router.post("/reset-password", validate(resetPasswordSchema), U.resetPassword);
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
  parseFieldsMiddleware,
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