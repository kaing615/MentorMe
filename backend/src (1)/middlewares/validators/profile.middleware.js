import { body } from "express-validator";

const updateMentorProfileValidator = [
  // Các field bắt buộc - không thể để trống
  body("firstName")
    .notEmpty()
    .withMessage("Họ không được để trống")
    .isLength({ min: 1, max: 50 })
    .withMessage("Họ phải từ 1-50 ký tự"),
  body("lastName")
    .notEmpty()
    .withMessage("Tên không được để trống")
    .isLength({ min: 1, max: 50 })
    .withMessage("Tên phải từ 1-50 ký tự"),
  body("userName")
    .notEmpty()
    .withMessage("Tên người dùng không được để trống")
    .isLength({ min: 3, max: 30 })
    .withMessage("Tên người dùng phải từ 3-30 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Tên người dùng chỉ chứa chữ, số và dấu gạch dưới"),

  // Các field quan trọng cho mentor - nên có validation mạnh
  body("jobTitle")
    .notEmpty()
    .withMessage("Job title không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Job title phải từ 2-100 ký tự"),
  body("category").notEmpty().withMessage("Category không được để trống"),
  body("bio")
    .notEmpty()
    .withMessage("Bio không được để trống")
    .isLength({ min: 50, max: 500 })
    .withMessage("Bio phải từ 50-500 ký tự"),
  body("mentorReason")
    .notEmpty()
    .withMessage("Lý do làm mentor không được để trống")
    .isLength({ min: 20, max: 300 })
    .withMessage("Lý do làm mentor phải từ 20-300 ký tự"),

  // Các field optional nhưng nếu có thì phải hợp lệ
  body("location")
    .optional()
    .notEmpty()
    .withMessage("Location không được để trống"),
  body("skills")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Skills phải là mảng và ít nhất 1 kỹ năng"),
  body("linkedinUrl")
    .optional()
    .isURL()
    .withMessage("LinkedIn URL không hợp lệ"),
  body("greatestAchievement")
    .optional()
    .notEmpty()
    .withMessage("Greatest Achievement không được để trống"),

  // Profile Model fields - detailed info
  body("headline")
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage("Headline phải từ 5-100 ký tự"),
  body("experience")
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Experience phải từ 10-1000 ký tự"),
  body("languages").optional().isArray().withMessage("Languages phải là mảng"),
  body("timezone")
    .optional()
    .notEmpty()
    .withMessage("Timezone không được để trống"),
  body("links").optional().isObject().withMessage("Links phải là object"),
  body("links.website")
    .optional()
    .isURL()
    .withMessage("Website URL không hợp lệ"),
  body("links.linkedin")
    .optional()
    .isURL()
    .withMessage("LinkedIn URL không hợp lệ"),
  body("links.github")
    .optional()
    .isURL()
    .withMessage("Github URL không hợp lệ"),
];

const updateMenteeProfileValidator = [
  // Các field bắt buộc - không thể để trống
  body("firstName")
    .notEmpty()
    .withMessage("Họ không được để trống")
    .isLength({ min: 1, max: 50 })
    .withMessage("Họ phải từ 1-50 ký tự"),
  body("lastName")
    .notEmpty()
    .withMessage("Tên không được để trống")
    .isLength({ min: 1, max: 50 })
    .withMessage("Tên phải từ 1-50 ký tự"),
  body("userName")
    .notEmpty()
    .withMessage("Tên người dùng không được để trống")
    .isLength({ min: 3, max: 30 })
    .withMessage("Tên người dùng phải từ 3-30 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Tên người dùng chỉ chứa chữ, số và dấu gạch dưới"),

  // Các field optional cho mentee
  body("bio")
    .optional()
    .notEmpty()
    .withMessage("Bio không được để trống")
    .isLength({ min: 10, max: 300 })
    .withMessage("Bio phải từ 10-300 ký tự"),
  body("location")
    .optional()
    .notEmpty()
    .withMessage("Location không được để trống"),
  body("linkedinUrl")
    .optional()
    .isURL()
    .withMessage("LinkedIn URL không hợp lệ"),

  // Profile Model fields cho mentee
  body("description")
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description phải từ 10-500 ký tự"),
  body("goal")
    .optional()
    .isLength({ min: 10, max: 300 })
    .withMessage("Goal phải từ 10-300 ký tự"),
  body("education")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Education phải từ 5-200 ký tự"),
  body("languages").optional().isArray().withMessage("Languages phải là mảng"),
  body("timezone")
    .optional()
    .notEmpty()
    .withMessage("Timezone không được để trống"),
  body("links").optional().isObject().withMessage("Links phải là object"),
];
export default {
  updateMentorProfileValidator,
  updateMenteeProfileValidator,
  changeAvatarValidator,
};
