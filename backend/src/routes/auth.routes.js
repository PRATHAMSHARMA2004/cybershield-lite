const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Brute-force protection: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',        protect, getMe);

module.exports = router;
