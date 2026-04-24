const { validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((item) => ({
        field: item.path,
        message: item.msg,
      })),
    });
  }

  return next();
};

module.exports = { handleValidation };
