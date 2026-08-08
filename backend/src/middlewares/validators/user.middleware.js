import { body, param } from "express-validator";

const signUpValidator = [
  body("firstName").notEmpty().withMessage("Họ không được để trống"),
  body("lastName").notEmpty().withMessage("Tên không được để trống"),
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("confirmPassword")
    .exists()
    .withMessage("Vui lòng xác nhận mật khẩu")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Mật khẩu xác nhận không khớp"),
  body("userName").notEmpty().withMessage("Tên người dùng không được để trống"),
];

const signUpMentorValidator = [
  body("firstName").notEmpty().withMessage("Họ không được để trống"),
  body("lastName").notEmpty().withMessage("Tên không được để trống"),
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("confirmPassword")
    .exists()
    .withMessage("Vui lòng xác nhận mật khẩu")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Mật khẩu xác nhận không khớp"),
  body("userName").notEmpty().withMessage("Tên người dùng không được để trống"),
  body("jobTitle").notEmpty().withMessage("Job title không được để trống"),
  body("location").notEmpty().withMessage("Location không được để trống"),
  body("category").notEmpty().withMessage("Category không được để trống"),
  body("skills")
    .isArray({ min: 1 })
    .withMessage("Skills phải là mảng và ít nhất 1 kỹ năng"),
  body("bio").notEmpty().withMessage("Bio không được để trống"),
  body("linkedinUrl")
    .optional()
    .isURL()
    .withMessage("LinkedIn URL không hợp lệ"),
  body("mentorReason")
    .notEmpty()
    .withMessage("Mentor Reason không được để trống")
    .isLength({ min: 50 })
    .withMessage("Mentor Reason phải có ít nhất 50 ký tự"),
  body("greatestAchievement")
    .notEmpty()
    .withMessage("Greatest Achievement không được để trống"),
  body("introVideo")
    .optional()
    .isURL()
    .withMessage("Intro Video phải là một URL hợp lệ"),
];

const signInValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
];

const resendEmailValidator = [
  param("email").isEmail().withMessage("Email không hợp lệ"),
];

const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
];

const resetPasswordValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("token")
    .isString()
    .withMessage("Liên kết đặt lại mật khẩu không hợp lệ"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

export default {
  signUpValidator,
  signUpMentorValidator,
  signInValidator,
  resendEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
