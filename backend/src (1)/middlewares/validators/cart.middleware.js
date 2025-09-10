import { body, param, validationResult } from "express-validator";
import responseHandler from "../../handlers/response.handler.js";

// Validator cho việc thêm course vào cart
const addToCartValidator = [
  body("courseId")
    .notEmpty()
    .withMessage("Course ID là bắt buộc")
    .isMongoId()
    .withMessage("Course ID không hợp lệ"),
];

// Validator cho việc xóa course khỏi cart
const removeFromCartValidator = [
  param("courseId")
    .notEmpty()
    .withMessage("Course ID là bắt buộc")
    .isMongoId()
    .withMessage("Course ID không hợp lệ"),
];

// Validator cho việc kiểm tra course trong cart
const checkInCartValidator = [
  param("courseId")
    .notEmpty()
    .withMessage("Course ID là bắt buộc")
    .isMongoId()
    .withMessage("Course ID không hợp lệ"),
];

// Middleware để xử lý kết quả validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return responseHandler.badrequest(res, errorMessages.join(", "));
  }
  next();
};

export default {
  addToCartValidator,
  removeFromCartValidator,
  checkInCartValidator,
  handleValidationErrors,
};
