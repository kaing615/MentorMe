import Joi from 'joi';
import mongoose from 'mongoose';

// Validate ObjectId
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'MongoDB ObjectId Validation');

// Schema cho việc tạo khóa học mới
export const createCourseSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  shortDescription: Joi.string().optional().allow(''), // Cho phép chuỗi rỗng
  thumbnail: Joi.string().optional().allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string().allow('')).optional(), // Cho phép mảng chuỗi rỗng
  duration: Joi.number().min(0).optional(),
  link: Joi.string().uri().optional().allow(''), // Validate link là URL và cho phép rỗng
  lectures: Joi.number().min(0).optional(),
  mentors: Joi.array().items(objectId).optional(), // Validate mentors là mảng các ObjectId
  // averageRating và numberOfRatings sẽ được BE tự tính toán, không cần validate ở đây
});

// Schema cho việc cập nhật khóa học (tất cả các trường đều optional)
export const updateCourseSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  shortDescription: Joi.string().optional().allow(''),
  thumbnail: Joi.string().optional().allow(''),
  price: Joi.number().min(0).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().allow('')).optional(),
  duration: Joi.number().min(0).optional(),
  link: Joi.string().uri().optional().allow(''),
  lectures: Joi.number().min(0).optional(),
  mentors: Joi.array().items(objectId).optional(),
  // Không cho phép cập nhật averageRating và numberOfRatings từ client
});

// Schema cho việc thêm mentor vào khóa học
export const addMentorSchema = Joi.object({
  mentorId: objectId.required(), // mentorId là bắt buộc và phải là ObjectId
});

// Schema cho việc thêm nội dung (bài học) vào khóa học
export const addContentSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  videoUrl: Joi.string().uri().optional().allow(''),
  documentUrl: Joi.string().uri().optional().allow(''),
  order: Joi.number().min(0).optional(),
});

// Schema cho việc thêm đánh giá khóa học
export const addReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(), // Điểm đánh giá từ 1 đến 5
  comment: Joi.string().optional().allow(''),
});
