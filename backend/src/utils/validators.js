const Joi = require("joi");


// ─────────────────────────────────────────
// Register Validation
// ─────────────────────────────────────────
const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),

    email: Joi.string().email().required(),

    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain uppercase, lowercase, and a number",
      }),
  });

  return schema.validate(data);
};


// ─────────────────────────────────────────
// Login Validation
// ─────────────────────────────────────────
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};


// ─────────────────────────────────────────
// URL Validation (Scanner Input)
// ─────────────────────────────────────────
const validateURL = (url) => {
  try {

    if (!url || typeof url !== "string") {
      return { valid: false, message: "URL is required" };
    }

    let normalized = url.trim();

    // If protocol missing → add https
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }

    const parsed = new URL(normalized);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        valid: false,
        message: "URL must use HTTP or HTTPS protocol",
      };
    }

    const hostname = parsed.hostname;
    if(!hostname.includes(".")) {
      return {
        valid: false,
        message: "Please enter full domain like example.com"
      };
    }

    // Block private / internal IP ranges
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          message: "Scanning private/local addresses is not allowed",
        };
      }
    }

    return {
      valid: true,
      normalizedUrl: normalized,
    };

  } catch {
    return {
      valid: false,
      message: "Invalid URL format",
    };
  }
};


// ─────────────────────────────────────────

module.exports = {
  validateRegister,
  validateLogin,
  validateURL,
};