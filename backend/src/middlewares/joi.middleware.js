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
    // Handle readonly properties like req.query
    try {
      if (property === "query") {
        // For query, we can't directly assign, so we update individual properties
        Object.keys(value).forEach(key => {
          req.query[key] = value[key];
        });
      } else {
        req[property] = value;
      }
    } catch (err) {
      console.warn(`Could not set req.${property}, skipping assignment:`, err.message);
    }
    
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
