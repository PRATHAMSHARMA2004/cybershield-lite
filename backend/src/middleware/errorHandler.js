const logger = require('../utils/logger');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired';  }

  // Log full detail server-side (stack always logged, never sent to client)
  logger.error('Request error', {
    message:    err.message,
    stack:      err.stack,
    statusCode,
    url:        req.originalUrl,
    method:     req.method,
    ip:         req.ip,
    userId:     req.user?._id,
  });

  // Response — stack traces NEVER exposed in production
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
