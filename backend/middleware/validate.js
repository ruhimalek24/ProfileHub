const { validationResult } = require('express-validator');

// Runs after express-validator rules. Stops the request if any rule failed.
function validate(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({
      success: false,
      message: errors[0].message,
      errors,
    });
  }

  next();
}

module.exports = validate;
