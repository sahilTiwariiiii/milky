const AppError = require('../utils/appError');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new AppError('Validation failed', 400, errorMessages));
    }

    // Replace request payload with sanitized, validated data
    req[property] = value;
    next();
  };
};

module.exports = validate;
