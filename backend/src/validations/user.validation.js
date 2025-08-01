import Joi from "joi";

// Base user validation
const userBase = {
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
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Mật khẩu xác nhận không khớp",
    "any.required": "Vui lòng xác nhận mật khẩu",
  }),
};

// Sign up validation (basic user)
export const signUpSchema = Joi.object({
  ...userBase,
});

// Sign up mentor validation (với profile fields)
export const signUpMentorSchema = Joi.object({
  ...userBase,
  // Profile fields for mentor
  jobTitle: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Job title không được để trống",
    "string.min": "Job title phải từ 2-100 ký tự",
    "string.max": "Job title phải từ 2-100 ký tự",
    "any.required": "Job title là bắt buộc",
  }),
  location: Joi.string().min(1).required().messages({
    "string.empty": "Location không được để trống",
    "any.required": "Location là bắt buộc",
  }),
  category: Joi.string().min(1).required().messages({
    "string.empty": "Category không được để trống",
    "any.required": "Category là bắt buộc",
  }),
  skills: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "Skills phải có ít nhất 1 kỹ năng",
    "any.required": "Skills là bắt buộc",
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
  greatestAchievement: Joi.string().min(1).optional().messages({
    "string.empty": "Greatest Achievement không được để trống",
  }),
  // Links object
  links: Joi.object({
    linkedin: Joi.string().uri().optional().messages({
      "string.uri": "LinkedIn URL không hợp lệ",
    }),
    website: Joi.string().uri().optional().messages({
      "string.uri": "Website URL không hợp lệ",
    }),
    github: Joi.string().uri().optional().messages({
      "string.uri": "Github URL không hợp lệ",
    }),
  }).optional(),
  introVideo: Joi.string().uri().optional().messages({
    "string.uri": "Intro Video phải là một URL hợp lệ",
  }),
});

// Sign in validation
export const signInSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),
});

// Forgot password validation
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});

// Reset password validation
export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  token: Joi.string().required().messages({
    "string.empty": "Liên kết đặt lại mật khẩu không hợp lệ",
    "any.required": "Token là bắt buộc",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu mới là bắt buộc",
  }),
});

// Resend email validation (params)
export const resendEmailParamsSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});

// Resend email validation (body)
export const resendEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});
