import Joi from "joi";

// Create course validation
export const createCourseSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    "string.empty": "Tiêu đề khóa học không được để trống",
    "string.min": "Tiêu đề khóa học phải từ 1-200 ký tự",
    "string.max": "Tiêu đề khóa học phải từ 1-200 ký tự",
    "any.required": "Tiêu đề khóa học là bắt buộc",
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    "string.empty": "Mô tả khóa học không được để trống",
    "string.min": "Mô tả khóa học phải có ít nhất 10 ký tự",
    "string.max": "Mô tả khóa học không được quá 2000 ký tự",
    "any.required": "Mô tả khóa học là bắt buộc",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Giá phải là số",
    "number.positive": "Giá phải lớn hơn 0",
    "any.required": "Giá khóa học là bắt buộc",
  }),
  category: Joi.string().required().messages({
    "string.empty": "Danh mục không được để trống",
    "any.required": "Danh mục là bắt buộc",
  }),
  tags: Joi.array().items(Joi.string()).optional(),
  duration: Joi.number().positive().required().messages({
    "number.base": "Thời lượng phải là số",
    "number.positive": "Thời lượng phải lớn hơn 0",
    "any.required": "Thời lượng khóa học là bắt buộc",
  }),
  link: Joi.string().uri().required().messages({
    "string.uri": "Link phải là URL hợp lệ",
    "any.required": "Link khóa học là bắt buộc",
  }),
  lectures: Joi.number().positive().integer().required().messages({
    "number.base": "Số bài giảng phải là số",
    "number.positive": "Số bài giảng phải lớn hơn 0",
    "number.integer": "Số bài giảng phải là số nguyên",
    "any.required": "Số bài giảng là bắt buộc",
  }),
});

// Purchase success validation
export const purchaseSuccessSchema = Joi.object({
  orderId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Order ID không hợp lệ",
      "any.required": "Order ID là bắt buộc",
    }),
});
