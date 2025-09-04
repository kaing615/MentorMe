/**
 * Joi Validation Middleware
 * Replaces express-validator with Joi for cleaner and more powerful validation
 */

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Collect all errors
      stripUnknown: true, // Remove unknown fields
      convert: true, // Auto convert types
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Replace req[property] with validated and sanitized data
    req[property] = value;
    next();
  };
};

// For validating params (like email in URL)
const validateParams = (schema) => validate(schema, "params");

// For validating query parameters
const validateQuery = (schema) => validate(schema, "query");

// For validating request body (default)
const validateBody = (schema) => validate(schema, "body");

export { validate, validateBody, validateParams, validateQuery };
