import { body, param } from "express-validator";

const signUpValidator = [
	body("email").isEmail().withMessage("Email không hợp lệ"),
	body("password")
		.isLength({ min: 6 })
		.withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
	body("userName")
		.notEmpty()
		.withMessage("Tên người dùng không được để trống"),
];

const signInValidator = [
	body("email").isEmail().withMessage("Email không hợp lệ"),
	body("password").notEmpty().withMessage("Mật khâu không được sé trống"),
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
	signInValidator,
	resendEmailValidator,
	forgotPasswordValidator,
	resetPasswordValidator,
};
