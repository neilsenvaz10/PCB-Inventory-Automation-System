// middleware/validate.js
const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results.
 * Place AFTER the validation chain in the route definition.
 * Returns 422 with structured errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
};

module.exports = { validate };
