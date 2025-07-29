import { body } from "express-validator";

const createCourseValidator = [
  body("title")
    .notEmpty()
    .withMessage("Tiêu đề khóa học không được để trống")
    .isLength({ min: 2, max: 200 })
    .withMessage("Tiêu đề khóa học phải từ 2-200 ký tự"),

  body("description")
    .notEmpty()
    .withMessage("Mô tả khóa học không được để trống")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Mô tả khóa học phải từ 10-2000 ký tự"),

  body("price")
    .isNumeric()
    .withMessage("Giá khóa học phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá khóa học phải lớn hơn hoặc bằng 0"),

  body("category")
    .notEmpty()
    .withMessage("Danh mục khóa học không được để trống"),

  body("duration")
    .isNumeric()
    .withMessage("Thời lượng khóa học phải là số")
    .isInt({ min: 1 })
    .withMessage("Thời lượng khóa học phải lớn hơn 0"),

  body("link")
    .notEmpty()
    .withMessage("Link khóa học không được để trống")
    .isURL()
    .withMessage("Link khóa học phải là URL hợp lệ"),

  body("lectures")
    .isNumeric()
    .withMessage("Số bài giảng phải là số")
    .isInt({ min: 1 })
    .withMessage("Số bài giảng phải lớn hơn 0"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags phải là mảng"),
];

const updateCourseValidator = [
  body("title")
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage("Tiêu đề khóa học phải từ 3-200 ký tự"),

  body("description")
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Mô tả khóa học phải từ 10-2000 ký tự"),

  body("price")
    .optional()
    .isNumeric()
    .withMessage("Giá khóa học phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá khóa học phải lớn hơn hoặc bằng 0"),

  body("duration")
    .optional()
    .isNumeric()
    .withMessage("Thời lượng khóa học phải là số")
    .isInt({ min: 1 })
    .withMessage("Thời lượng khóa học phải lớn hơn 0"),

  body("link")
    .optional()
    .isURL()
    .withMessage("Link khóa học phải là URL hợp lệ"),

  body("lectures")
    .optional()
    .isNumeric()
    .withMessage("Số bài giảng phải là số")
    .isInt({ min: 1 })
    .withMessage("Số bài giảng phải lớn hơn 0"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags phải là mảng"),
];

export default {
  createCourseValidator,
  updateCourseValidator,
};
