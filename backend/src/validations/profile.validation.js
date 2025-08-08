import Joi from "joi";

// Base profile validation
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

// Update mentor profile validation
export const updateMentorProfileSchema = Joi.object({
  // User Model fields
  ...profileBase,

  // Profile Model fields - bắt buộc cho mentor
  jobTitle: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Job title không được để trống",
    "string.min": "Job title phải từ 2-100 ký tự",
    "string.max": "Job title phải từ 2-100 ký tự",
    "any.required": "Job title là bắt buộc",
  }),
  category: Joi.string().min(1).required().messages({
    "string.empty": "Category không được để trống",
    "any.required": "Category là bắt buộc",
  }),
  bio: Joi.string().min(50).max(500).required().messages({
    "string.empty": "Bio không được để trống",
    "string.min": "Bio phải từ 50-500 ký tự",
    "string.max": "Bio phải từ 50-500 ký tự",
    "any.required": "Bio là bắt buộc",
  }),
  mentorReason: Joi.string().min(20).max(300).required().messages({
    "string.empty": "Lý do làm mentor không được để trống",
    "string.min": "Lý do làm mentor phải từ 20-300 ký tự",
    "string.max": "Lý do làm mentor phải từ 20-300 ký tự",
    "any.required": "Lý do làm mentor là bắt buộc",
  }),

  // Optional fields
  location: Joi.string().min(1).optional().messages({
    "string.empty": "Location không được để trống",
  }),
  skills: Joi.array().items(Joi.string()).min(1).optional().messages({
    "array.min": "Skills phải có ít nhất 1 kỹ năng",
  }),
  greatestAchievement: Joi.string().min(1).optional().messages({
    "string.empty": "Greatest Achievement không được để trống",
  }),

  // Profile Model fields - detailed info
  headline: Joi.string().min(5).max(100).optional().messages({
    "string.min": "Headline phải từ 5-100 ký tự",
    "string.max": "Headline phải từ 5-100 ký tự",
  }),
  experience: Joi.string().min(10).max(1000).optional().messages({
    "string.min": "Experience phải từ 10-1000 ký tự",
    "string.max": "Experience phải từ 10-1000 ký tự",
  }),
  introVideo: Joi.string().uri().optional().messages({
    "string.uri": "Intro Video phải là URL hợp lệ",
  }),
  languages: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Languages phải là mảng",
  }),
  timezone: Joi.string().min(1).optional().messages({
    "string.empty": "Timezone không được để trống",
  }),

  // Links object
  links: Joi.object({
    website: Joi.string().uri().optional().messages({
      "string.uri": "Website URL không hợp lệ",
    }),
    linkedin: Joi.string().uri().optional().messages({
      "string.uri": "LinkedIn URL không hợp lệ",
    }),
    github: Joi.string().uri().optional().messages({
      "string.uri": "Github URL không hợp lệ",
    }),
    X: Joi.string().uri().optional().messages({
      "string.uri": "X URL không hợp lệ",
    }),
    youtube: Joi.string().uri().optional().messages({
      "string.uri": "Youtube URL không hợp lệ",
    }),
    facebook: Joi.string().uri().optional().messages({
      "string.uri": "Facebook URL không hợp lệ",
    }),
  }).optional(),
});

// Update mentee profile validation
export const updateMenteeProfileSchema = Joi.object({
  // User Model fields
  ...profileBase,

  // Profile Model fields - optional cho mentee
  bio: Joi.string().min(10).max(300).optional().messages({
    "string.min": "Bio phải từ 10-300 ký tự",
    "string.max": "Bio phải từ 10-300 ký tự",
  }),
  location: Joi.string().min(1).optional().messages({
    "string.empty": "Location không được để trống",
  }),

  // Profile Model fields cho mentee
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
  languages: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Languages phải là mảng",
  }),
  timezone: Joi.string().min(1).optional().messages({
    "string.empty": "Timezone không được để trống",
  }),

  // Links object
  links: Joi.object({
    linkedin: Joi.string().uri().optional().messages({
      "string.uri": "LinkedIn URL không hợp lệ",
    }),
    github: Joi.string().uri().optional().messages({
      "string.uri": "Github URL không hợp lệ",
    }),
    website: Joi.string().uri().optional().messages({
      "string.uri": "Website URL không hợp lệ",
    }),
  }).optional(),
});

// Change avatar validation (no body validation needed - just file)
