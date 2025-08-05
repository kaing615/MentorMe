import { body, validationResult } from 'express-validator';
import responseHandler from '../handlers/response.handler.js';

// Validation rules for creating a new course
export const validateCreateCourse = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters')
    .trim(),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Health & Fitness', 'Language', 'Academic', 'Lifestyle'])
    .withMessage('Invalid category'),

  body('level')
    .notEmpty()
    .withMessage('Level is required')
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced, Expert'),

  body('lectures')
    .notEmpty()
    .withMessage('Number of lectures is required')
    .isInt({ min: 1 })
    .withMessage('Number of lectures must be a positive integer'),

  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number')
    .custom((value) => {
      if (value && value <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      return true;
    }),

  body('courseOverview')
    .notEmpty()
    .withMessage('Course overview is required')
    .isLength({ max: 1000 })
    .withMessage('Course overview must be less than 1000 characters')
    .trim(),

  body('keyLearningObjectives')
    .notEmpty()
    .withMessage('Key learning objectives are required')
    .isLength({ max: 500 })
    .withMessage('Key learning objectives must be less than 500 characters')
    .trim(),

  body('driveLink')
    .notEmpty()
    .withMessage('Drive link is required')
    .isURL()
    .withMessage('Drive link must be a valid URL')
    .custom((value) => {
      if (!value.includes('drive.google.com')) {
        throw new Error('Must be a valid Google Drive link');
      }
      return true;
    }),

  // Handle validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }));
      return responseHandler.badRequest(res, 'Validation failed', { errors: errorMessages });
    }
    next();
  }
];

// Validation rules for course data validation endpoint
export const validateCourseData = [
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters')
    .trim(),

  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value && value <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),

  body('category')
    .optional()
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Health & Fitness', 'Language', 'Academic', 'Lifestyle'])
    .withMessage('Invalid category'),

  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Level must be one of: Beginner, Intermediate, Advanced, Expert'),

  body('lectures')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of lectures must be a positive integer'),

  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number')
    .custom((value) => {
      if (value && value <= 0) {
        throw new Error('Duration must be greater than 0');
      }
      return true;
    }),

  body('courseOverview')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Course overview must be less than 1000 characters')
    .trim(),

  body('keyLearningObjectives')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Key learning objectives must be less than 500 characters')
    .trim(),

  body('driveLink')
    .optional()
    .isURL()
    .withMessage('Drive link must be a valid URL')
    .custom((value) => {
      if (value && !value.includes('drive.google.com')) {
        throw new Error('Must be a valid Google Drive link');
      }
      return true;
    }),

  // Handle validation results for validation endpoint
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }));
      // For validation endpoint, we return the errors without stopping execution
      req.validationErrors = errorMessages;
    }
    next();
  }
];
