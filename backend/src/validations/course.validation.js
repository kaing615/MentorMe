// backend/src/validation/course.validation.js
import Joi from "joi";
import mongoose from "mongoose";

// MongoDB ObjectId validator
export const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "MongoDB ObjectId Validation");

// Helpers: number từ số hoặc chuỗi số
const numberFromString = (opts = {}) => {
  const { min, integer, allowEmptyString } = opts;
  const baseNum = Joi.number()[integer ? "integer" : "min"]?.(min ?? 0) ?? Joi.number();
  const numSchema = integer ? Joi.number().integer().min(min ?? 0) : Joi.number().min(min ?? 0);

  const strToNum = Joi.string()
    .pattern(integer ? /^\d+$/ : /^\d+(\.\d+)?$/)
    .custom((value, helpers) => {
      if (allowEmptyString && value === "") return undefined;
      const n = integer ? parseInt(value, 10) : parseFloat(value);
      if (Number.isNaN(n)) return helpers.error("any.invalid");
      return n;
    });

  return Joi.alternatives().try(numSchema, strToNum);
};

// ========== CREATE COURSE ==========
export const createCourseSchema = Joi.object({
  // Tiêu đề
  title: Joi.string().min(1).max(200).required().messages({
    "string.empty": "Tiêu đề khóa học không được để trống",
    "string.min": "Tiêu đề khóa học phải từ 1-200 ký tự",
    "string.max": "Tiêu đề khóa học phải từ 1-200 ký tự",
    "any.required": "Tiêu đề khóa học là bắt buộc",
  }),

  // Mô tả (ít nhất một trong hai field phải có)
  description: Joi.string().min(10).max(2000),
  courseOverview: Joi.string().min(10).max(2000),

  // Giá
  price: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string()
        .pattern(/^\d+(\.\d{1,2})?$/)
        .custom((value, helpers) => {
          const num = parseFloat(value);
          if (Number.isNaN(num)) return helpers.error("any.invalid");
          return num;
        })
    )
    .required()
    .messages({
      "any.required": "Giá khóa học là bắt buộc",
      "number.min": "Giá phải >= 0",
    }),

  // Danh mục
  category: Joi.string().required().messages({
    "string.empty": "Danh mục không được để trống",
    "any.required": "Danh mục là bắt buộc",
  }),

  // Level (nếu có)
  level: Joi.string().valid("Beginner", "Intermediate", "Advanced", "Expert"),

  // Mục tiêu học (optional)
  keyLearningObjectives: Joi.string().allow(""),

  // Số bài giảng
  lectures: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string()
        .pattern(/^\d+$/)
        .custom((value, helpers) => {
          const num = parseInt(value, 10);
          if (Number.isNaN(num)) return helpers.error("any.invalid");
          return num;
        })
    )
    .required()
    .messages({
      "any.required": "Số bài giảng là bắt buộc",
    }),

  // Thời lượng (phút) — cho phép chuỗi rỗng
  duration: numberFromString({ min: 0, integer: true, allowEmptyString: true }).optional(),

  // Link khoá học: chấp nhận 'link' hoặc 'driveLink' (chỉ cần 1)
  link: Joi.string().uri(),
  driveLink: Joi.string().uri(),

  // Tag (optional)
  tags: Joi.array().items(Joi.string().allow("")).optional(),

  // Thumbnail do multer xử lý — không validate ở đây
})
  .or("description", "courseOverview")
  .or("link", "driveLink")
  .messages({
    "object.missing": "Cần cung cấp mô tả (description/courseOverview) và link (link/driveLink).",
  });

// ========== UPDATE COURSE ==========
export const updateCourseSchema = Joi.object({
  // Nếu field thực tế là 'title', đổi lại cho đúng controller
  name: Joi.string().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional().allow(""),
  shortDescription: Joi.string().optional().allow(""),
  thumbnail: Joi.string().optional().allow(""),
  price: numberFromString({ min: 0 }).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().allow("")).optional(),
  duration: numberFromString({ min: 0, integer: true }).optional(),
  link: Joi.string().uri().optional().allow(""),
  driveLink: Joi.string().uri().optional().allow(""),
  lectures: numberFromString({ min: 0, integer: true }).optional(),
  mentors: Joi.array().items(objectId).optional(),
});

// ========== ADD MENTOR ==========
export const addMentorSchema = Joi.object({
  mentorId: objectId.required(),
});

// ========== ADD CONTENT ==========
export const addContentSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional().allow(""),
  videoUrl: Joi.string().uri().optional().allow(""),
  documentUrl: Joi.string().uri().optional().allow(""),
  order: numberFromString({ min: 0, integer: true }).optional(),
});

// ========== ADD REVIEW ==========
export const addReviewSchema = Joi.object({
  rating: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(5),              // nhận số 1..5
      Joi.string()                                       // nhận chuỗi "1".."5"
        .pattern(/^[1-5]$/)
        .custom((value) => parseInt(value, 10))
    )
    .required(),
  comment: Joi.string().optional().allow(""),
});
