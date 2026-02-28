const Joi = require('joi');

const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
      }),
  });
  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};

const validateURL = (url) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, message: 'URL must use HTTP or HTTPS protocol' };
    }
    // Block private IP ranges
    const hostname = parsed.hostname;
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
    ];
    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, message: 'Scanning private/local addresses is not allowed' };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }
};

module.exports = { validateRegister, validateLogin, validateURL };
