const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();

const { 
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');

// Brute-force protection: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📧 Rate limiter for resend verification: 5 attempts per 1 hour per IP
// (User-based limiting is done in the controller)
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many resend requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);

router.post('/login', authLimiter, login);

// 📧 Email Verification
router.get('/verify-email/:token', verifyEmail);

// 📧 Resend Verification Email
router.post('/resend-verification', resendVerificationLimiter, resendVerification);

// 🔐 Forgot Password
router.post('/forgot-password', authLimiter, forgotPassword);

// 🔐 Reset Password
router.post('/reset-password/:token', authLimiter, resetPassword);

// 👤 Current user
router.get('/me', protect, getMe);

module.exports = router;