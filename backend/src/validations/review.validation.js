import Joi from "joi";

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message("Must be a valid ObjectId");

const singleSchema = Joi.object({
  targetType: Joi.string().valid("Course", "Mentor", "Booking").required(),
  target: objectId.required(),
  content: Joi.string().max(2000).allow("").optional(),
  rate: Joi.number().integer().min(1).max(5).required(),
});

export const createReviewBody = Joi.alternatives()
  .try(singleSchema, Joi.array().items(singleSchema).min(1).max(20))
  .messages({
    "any.required": "Missing required field",
    "array.min": "Array must contain at least one review",
    "array.max": "Array too large",
  });

export const updateReviewBody = Joi.object({
    content: Joi.string().max(2000).allow("").optional(),
    rate: Joi.number().integer().min(1).max(5).optional(),
    }).min(1).messages({
    "object.min": "At least one field (content or rate) is required",
});

export const getReviewsQuery = Joi.object({
    targetType: Joi.string().valid("Course", "Mentor", "Booking").required(),
    target: objectId.required(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    page: Joi.number().integer().min(1).optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
});

export default {
  createReviewBody,
  updateReviewBody,
  getReviewsQuery
};
