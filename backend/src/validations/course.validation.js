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
  const baseNum =
    Joi.number()[integer ? "integer" : "min"]?.(min ?? 0) ?? Joi.number();
  const numSchema = integer
    ? Joi.number()
        .integer()
        .min(min ?? 0)
    : Joi.number().min(min ?? 0);

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
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Course title cannot be empty",
    "string.min": "Course title must be between 3-100 characters",
    "string.max": "Course title must be between 3-100 characters",
    "any.required": "Course title is required",
  }),

  // Mô tả - frontend gửi courseOverview
  description: Joi.string().min(20).max(1000).optional().messages({
    "string.min": "Course description must be between 20-1000 characters",
    "string.max": "Course description must be between 20-1000 characters",
  }),
  courseOverview: Joi.string().min(20).max(1000).optional().messages({
    "string.min": "Course overview must be between 20-1000 characters",
    "string.max": "Course overview must be between 20-1000 characters",
  }),

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
      "any.required": "Course price is required",
      "number.min": "Price must be greater than or equal to 0",
    }),

  // Danh mục
  category: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Category cannot be empty",
    "string.min": "Category must be between 2-50 characters",
    "string.max": "Category must be between 2-50 characters",
    "any.required": "Category is required",
  }),

  // Level (nếu có)
  level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced", "Expert")
    .required()
    .messages({
      "any.required": "Level is required",
      "any.only":
        "Level must be one of: Beginner, Intermediate, Advanced, Expert",
    }),

  // Mục tiêu học (optional)
  keyLearningObjectives: Joi.string()
    .min(10)
    .max(200)
    .allow("")
    .optional()
    .messages({
      "string.min": "Learning objectives must be between 10-200 characters",
      "string.max": "Learning objectives must be between 10-200 characters",
    }),

  // Số bài giảng
  lectures: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(500),
      Joi.string()
        .pattern(/^\d+$/)
        .custom((value, helpers) => {
          const num = parseInt(value, 10);
          if (Number.isNaN(num) || num < 1 || num > 500)
            return helpers.error("any.invalid");
          return num;
        })
    )
    .required()
    .messages({
      "any.required": "Number of lectures is required",
      "number.min": "Number of lectures must be between 1-500",
      "number.max": "Number of lectures must be between 1-500",
    }),

  // Thời lượng (giờ) — cho phép chuỗi rỗng và số thập phân
  duration: numberFromString({
    min: 0,
    max: 1000,
    integer: false,
    allowEmptyString: true,
  })
    .optional()
    .messages({
      "number.min": "Duration must be between 0-1000 hours",
      "number.max": "Duration must be between 0-1000 hours",
    }),

  // Link khoá học - frontend gửi driveLink
  link: Joi.string().uri().min(10).max(500).optional().messages({
    "string.min": "Link must be between 10-500 characters",
    "string.max": "Link must be between 10-500 characters",
    "string.uri": "Link must be a valid URL",
  }),
  driveLink: Joi.string().uri().min(10).max(500).optional().messages({
    "string.min": "Drive link must be between 10-500 characters",
    "string.max": "Drive link must be between 10-500 characters",
    "string.uri": "Drive link must be a valid URL",
  }),

  // Tag (optional) - có thể là string hoặc array
  tags: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(1).max(30).allow("")),
      Joi.string().min(1).max(200).allow("")
    )
    .optional()
    .messages({
      "string.min": "Each tag must be between 1-30 characters",
      "string.max": "Tags field must be less than 200 characters total",
    }),

  // Language (optional) - có thể là string hoặc array
  language: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(2).max(30).allow("")),
      Joi.string().min(2).max(100).allow("")
    )
    .optional()
    .messages({
      "string.min": "Each language must be between 2-30 characters",
      "string.max": "Language field must be less than 100 characters total",
    }),
}).custom((value, helpers) => {
  // Đảm bảo có ít nhất description hoặc courseOverview
  if (!value.description && !value.courseOverview) {
    return helpers.error("object.missing", {
      message: "Course description or overview is required",
    });
  }

  // Đảm bảo có ít nhất link hoặc driveLink
  if (!value.link && !value.driveLink) {
    return helpers.error("object.missing", {
      message: "Course link or drive link is required",
    });
  }

  return value;
});

// ========== UPDATE COURSE ==========
export const updateCourseSchema = Joi.object({
  // Nếu field thực tế là 'title', đổi lại cho đúng controller
  name: Joi.string().min(5).max(100).optional().messages({
    "string.min": "Course name must be between 5-100 characters",
    "string.max": "Course name must be between 5-100 characters",
  }),
  title: Joi.string().min(5).max(100).optional().messages({
    "string.min": "Course title must be between 5-100 characters",
    "string.max": "Course title must be between 5-100 characters",
  }),
  description: Joi.string().min(20).max(1000).optional().allow("").messages({
    "string.min": "Course description must be between 20-1000 characters",
    "string.max": "Course description must be between 20-1000 characters",
  }),
  courseOverview: Joi.string().min(20).max(1000).optional().allow("").messages({
    "string.min": "Course overview must be between 20-1000 characters",
    "string.max": "Course overview must be between 20-1000 characters",
  }),
  shortDescription: Joi.string()
    .min(10)
    .max(200)
    .optional()
    .allow("")
    .messages({
      "string.min": "Short description must be between 10-200 characters",
      "string.max": "Short description must be between 10-200 characters",
    }),
  thumbnail: Joi.string().optional().allow(""),
  price: numberFromString({ min: 0 }).optional().messages({
    "number.min": "Price must be greater than or equal to 0",
  }),
  category: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Category must be between 2-50 characters",
    "string.max": "Category must be between 2-50 characters",
  }),
  level: Joi.string()
    .valid("Beginner", "Intermediate", "Advanced", "Expert")
    .optional()
    .messages({
      "any.only":
        "Level must be one of: Beginner, Intermediate, Advanced, Expert",
    }),
  lectures: numberFromString({ min: 1, max: 500, integer: true })
    .optional()
    .messages({
      "number.min": "Number of lectures must be between 1-500",
      "number.max": "Number of lectures must be between 1-500",
    }),
  duration: numberFromString({ min: 0, max: 1000, integer: false })
    .optional()
    .messages({
      "number.min": "Duration must be between 0-1000 hours",
      "number.max": "Duration must be between 0-1000 hours",
    }),
  keyLearningObjectives: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(10).max(200)),
      Joi.string().min(10).max(500).allow("")
    )
    .optional()
    .messages({
      "string.min": "Each learning objective must be between 10-200 characters",
      "string.max":
        "Learning objectives must be between 10-500 characters total",
    }),

  // Tag (optional) - có thể là string hoặc array (giống createCourseSchema)
  tags: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(1).max(30).allow("")),
      Joi.string().min(1).max(200).allow("")
    )
    .optional()
    .messages({
      "string.min": "Each tag must be between 1-30 characters",
      "string.max": "Tags field must be less than 200 characters total",
    }),

  // Language (optional) - có thể là string hoặc array (giống createCourseSchema)
  language: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().min(2).max(30).allow("")),
      Joi.string().min(2).max(100).allow("")
    )
    .optional()
    .messages({
      "string.min": "Each language must be between 2-30 characters",
      "string.max": "Language field must be less than 100 characters total",
    }),

  link: Joi.string().uri().min(10).max(500).optional().allow("").messages({
    "string.min": "Link must be between 10-500 characters",
    "string.max": "Link must be between 10-500 characters",
    "string.uri": "Link must be a valid URL",
  }),
  driveLink: Joi.string().uri().min(10).max(500).optional().allow("").messages({
    "string.min": "Drive link must be between 10-500 characters",
    "string.max": "Drive link must be between 10-500 characters",
    "string.uri": "Drive link must be a valid URL",
  }),
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
      Joi.number().integer().min(1).max(5), // nhận số 1..5
      Joi.string() // nhận chuỗi "1".."5"
        .pattern(/^[1-5]$/)
        .custom((value) => parseInt(value, 10))
    )
    .required(),
  comment: Joi.string().optional().allow(""),
});
