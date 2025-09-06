import Joi from "joi";

const profileBase = {
  firstName: Joi.string().min(1).max(50).required().messages({
    "string.empty": "Họ không được để trống",
    "string.min": "Họ phải từ 1-50 ký tự",
    "string.max": "Họ phải từ 1-50 ký tự",
    "any.required": "Họ là bắt buộc",
  }),
  lastName: Joi.string().min(1).max(50).required().messages({
    "string.empty": "Tên không được để trống",
    "string.min": "Tên phải từ 1-50 ký tự",
    "string.max": "Tên phải từ 1-50 ký tự",
    "any.required": "Tên là bắt buộc",
  }),
  userName: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      "string.empty": "Tên người dùng không được để trống",
      "string.min": "Tên người dùng phải từ 3-30 ký tự",
      "string.max": "Tên người dùng phải từ 3-30 ký tự",
      "string.pattern.base": "Tên người dùng chỉ chứa chữ, số và dấu gạch dưới",
      "any.required": "Tên người dùng là bắt buộc",
    }),
};

export const updateMentorProfileSchema = Joi.object({
  ...profileBase,

  jobTitle: Joi.string().min(2).required().messages({
    "string.empty": "Job title không được để trống",
    "string.min": "Job title phải từ 2-100 ký tự",
    "any.required": "Job title là bắt buộc",
  }),
  category: Joi.string().min(1).required().messages({
    "string.empty": "Category không được để trống",
    "any.required": "Category là bắt buộc",
  }),
  bio: Joi.string().min(50).required().messages({
    "string.empty": "Bio không được để trống",
    "string.min": "Bio phải từ 50-500 ký tự",
    "any.required": "Bio là bắt buộc",
  }),
  mentorReason: Joi.string().min(20).required().messages({
    "string.empty": "Lý do làm mentor không được để trống",
    "string.min": "Lý do làm mentor phải từ 20-300 ký tự",
    "any.required": "Lý do làm mentor là bắt buộc",
  }),

  location: Joi.string().min(1).optional().allow("").messages({
    "string.empty": "Location không được để trống",
  }),

  skills: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .required()
    .messages({
      "array.base": "Skills phải là mảng hoặc chuỗi",
    }),

  greatestAchievement: Joi.string().min(1).optional().allow("").messages({
    "string.empty": "Greatest Achievement không được để trống",
  }),

  headline: Joi.string().min(5).optional().allow("").messages({
    "string.min": "Headline phải từ 5-100 ký tự",
  }),
  experience: Joi.string().min(10).required().messages({
    "string.min": "Experience phải từ 10-1000 ký tự",
  }),
  introVideo: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Intro Video phải là URL hợp lệ",
  }),

  languages: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional()
    .messages({
      "array.base": "Languages phải là mảng hoặc chuỗi",
    }),

  timezone: Joi.string().min(1).optional().messages({
    "string.empty": "Timezone không được để trống",
  }),

  links: Joi.object({
    website: Joi.string()
      .uri()
      .optional()
      .messages({ "string.uri": "Website URL không hợp lệ" }),
    linkedin: Joi.string()
      .uri()
      .optional()
      .messages({ "string.uri": "LinkedIn URL không hợp lệ" }),
    github: Joi.string()
      .uri()
      .optional()
      .messages({ "string.uri": "Github URL không hợp lệ" }),
    X: Joi.string()
      .uri()
      .optional()
      .messages({ "string.uri": "X URL không hợp lệ" }),
    youtube: Joi.string()
      .uri()
      .optional()
      .messages({ "string.uri": "Youtube URL không hợp lệ" }),
    facebook: Joi.string()
      .uri()
      .optional()
      .messages({ "string.uri": "Facebook URL không hợp lệ" }),
  }).optional(),
});

export const updateMenteeProfileSchema = Joi.object({
  ...profileBase,

  bio: Joi.string().min(10).optional().messages({
    "string.min": "Bio phải từ 10",
  }),
  location: Joi.string().min(1).optional().messages({
    "string.empty": "Location không được để trống",
  }),

  description: Joi.string().min(10).max(500).optional().messages({
    "string.min": "Description phải từ 10-500 ký tự",
    "string.max": "Description phải từ 10-500 ký tự",
  }),
  goal: Joi.string().min(10).max(300).optional().messages({
    "string.min": "Goal phải từ 10-300 ký tự",
    "string.max": "Goal phải từ 10-300 ký tự",
  }),
  education: Joi.string().min(5).max(200).optional().messages({
    "string.min": "Education phải từ 5-200 ký tự",
    "string.max": "Education phải từ 5-200 ký tự",
  }),

  languages: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional()
    .messages({
      "array.base": "Languages phải là mảng hoặc chuỗi",
    }),

  timezone: Joi.string().min(1).optional().messages({
    "string.empty": "Timezone không được để trống",
  }),

  links: Joi.object({
    linkedin: Joi.string()
      .uri()
      .optional()
      .allow("")
      .messages({ "string.uri": "LinkedIn URL không hợp lệ" }),
    github: Joi.string()
      .uri()
      .optional()
      .allow("")
      .messages({ "string.uri": "Github URL không hợp lệ" }),
    website: Joi.string()
      .uri()
      .optional()
      .allow("")
      .messages({ "string.uri": "Website URL không hợp lệ" }),
    twitter: Joi.string()
      .uri()
      .optional()
      .allow("")
      .messages({ "string.uri": "Twitter URL không hợp lệ" }),
    facebook: Joi.string()
      .uri()
      .optional()
      .allow("")
      .messages({ "string.uri": "Facebook URL không hợp lệ" }),
  }).optional(),
});

// Search mentors validation
export const searchMentorsSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    "string.empty": "Tên không được để trống",
    "string.min": "Tên phải từ 1-100 ký tự",
    "string.max": "Tên phải từ 1-100 ký tự",
  }),
  id: Joi.string().length(24).hex().optional().messages({
    "string.length": "ID phải có 24 ký tự",
    "string.hex": "ID phải là hex string hợp lệ",
  }),
  category: Joi.string().min(1).max(50).optional().messages({
    "string.empty": "Danh mục không được để trống",
    "string.min": "Danh mục phải từ 1-50 ký tự",
    "string.max": "Danh mục phải từ 1-50 ký tự",
  }),
  skills: Joi.string().optional().messages({
    "string.base": "Kỹ năng phải là chuỗi",
  }),
  location: Joi.string().min(1).max(100).optional().messages({
    "string.empty": "Địa điểm không được để trống",
    "string.min": "Địa điểm phải từ 1-100 ký tự",
    "string.max": "Địa điểm phải từ 1-100 ký tự",
  }),
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Trang phải là số",
    "number.integer": "Trang phải là số nguyên",
    "number.min": "Trang phải lớn hơn 0",
  }),
  limit: Joi.number().integer().min(1).max(50).optional().messages({
    "number.base": "Limit phải là số",
    "number.integer": "Limit phải là số nguyên",
    "number.min": "Limit phải lớn hơn 0",
    "number.max": "Limit không được vượt quá 50",
  }),
});

// Change avatar validation (no body validation needed - just file)
