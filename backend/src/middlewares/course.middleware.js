import { body, param } from "express-validator";

const createCourseValidator = [
  body("title")
    .notEmpty()
    .withMessage("Course title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .notEmpty()
    .withMessage("Course description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),
  body("category")
    .notEmpty()
    .withMessage("Category is required"),
  body("level")
    .notEmpty()
    .withMessage("Level is required")
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage("Level must be one of: beginner, intermediate, advanced, expert"),
  body("duration")
    .optional()
    .isNumeric()
    .withMessage("Duration must be a number")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 hour"),
  body("link")
    .optional()
    .isURL()
    .withMessage("Link must be a valid URL"),
  body("driveLink")
    .notEmpty()
    .withMessage("Google Drive link is required")
    .isURL()
    .withMessage("Drive link must be a valid URL"),
  body("lectures")
    .isNumeric()
    .withMessage("Number of lectures must be a number")
    .isInt({ min: 1 })
    .withMessage("Must have at least 1 lecture"),
];

const updateCourseValidator = [
  body("title")
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),
  body("duration")
    .optional()
    .isNumeric()
    .withMessage("Duration must be a number")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 hour"),
  body("link")
    .optional()
    .isURL()
    .withMessage("Link must be a valid URL"),
  body("lectures")
    .optional()
    .isNumeric()
    .withMessage("Number of lectures must be a number")
    .isInt({ min: 1 })
    .withMessage("Must have at least 1 lecture"),
];

const courseIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid course ID"),
];

const reviewValidator = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),
];

export {
  createCourseValidator,
  updateCourseValidator,
  courseIdValidator,
  reviewValidator
};
