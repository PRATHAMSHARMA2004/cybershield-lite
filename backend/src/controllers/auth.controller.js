const User = require('../models/User.model');
const { generateToken } = require('../utils/jwt');
const { validateRegister, validateLogin } = require('../utils/validators');
const logger = require('../utils/logger');
const crypto = require('crypto');

const { 
  sendVerificationEmail, 
  sendResetPasswordEmail 
} = require('../services/email.service');

// ─────────────────────────────────
// 🔒 SECURITY CONFIGURATIONS
// ─────────────────────────────────

// Disposable email domains to block
const BLOCKED_DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'trashmail.com',
  'tempmail.com',
  'throwaway.email',
  'maildrop.cc',
  'yopmail.com',
  'fakeinbox.com',
  'temporarymail.com',
  'temp-mail.io',
  'mailnesia.com',
];

// ─────────────────────────────────
// Helper Functions
// ─────────────────────────────────

/**
 * Check if email uses a disposable/temporary email service
 * @param {string} email
 * @returns {boolean}
 */
const isDisposableEmail = (email) => {
  const domain = email.toLowerCase().split('@')[1];
  return BLOCKED_DISPOSABLE_DOMAINS.includes(domain);
};

/**
 * Check rate limit for verification resend (max 3 per hour)
 * @param {object} user
 * @returns {object} { allowed: boolean, message: string }
 */
const checkResendRateLimit = (user) => {
  const RESEND_LIMIT = 3;
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

  if (!user.verificationLastAttempt) {
    return { allowed: true };
  }

  const timeSinceLastAttempt = Date.now() - user.verificationLastAttempt.getTime();

  if (timeSinceLastAttempt < RATE_LIMIT_WINDOW && user.verificationAttempts >= RESEND_LIMIT) {
    const minutesRemaining = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastAttempt) / 60000);
    return {
      allowed: false,
      message: `Too many resend attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`
    };
  }

  // Reset counter if outside the window
  if (timeSinceLastAttempt >= RATE_LIMIT_WINDOW) {
    return { allowed: true, totallyFresh: true };
  }

  return { allowed: true };
};


// ─────────────────────────────────
// Register
// ─────────────────────────────────
const register = async (req, res, next) => {

  try {

    const { error } = validateRegister(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, password } = req.body;

    // 🔒 Check for disposable email
    if (isDisposableEmail(email)) {
      logger.warn(`Registration attempt with disposable email: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Disposable email addresses are not allowed. Please use a valid email address.'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      // 🔒 Set verification expiry to 24 hours
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.emailVerificationToken = verificationToken;
    // Initialize rate limiting counters
    user.verificationAttempts = 1;
    user.verificationLastAttempt = new Date();

    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send verification email
    await sendVerificationEmail(email, verifyUrl);

    const token = generateToken(user._id);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email within 24 hours.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
    });

  } catch (error) {
    next(error);
  }

};


// ─────────────────────────────────
// Verify Email
// ─────────────────────────────────
const verifyEmail = async (req, res, next) => {

  try {

    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link"
      });
    }

    // 🔒 Check if verification token has expired
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      logger.warn(`Expired verification attempt for: ${user.email}`);
      return res.status(410).json({
        success: false,
        message: "Verification link has expired. Please register again or request a new verification link."
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    // 🔒 Clear verification expiry for verified users
    user.verificationExpires = null;
    // Reset rate limiting counters
    user.verificationAttempts = 0;
    user.verificationLastAttempt = null;

    await user.save({ validateBeforeSave: false });

    logger.info(`Email verified successfully for: ${user.email}`);

    res.json({
      success: true,
      message: "Email verified successfully. You can now login."
    });

  } catch (error) {
    next(error);
  }

};



// ─────────────────────────────────
// Login
// ─────────────────────────────────
const login = async (req, res, next) => {

  try {

    const { error } = validateLogin(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Email verification check
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    user.lastLogin = new Date();

    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    next(error);
  }

};

// ─────────────────────────────────
// Resend Verification Email
// ─────────────────────────────────
const resendVerification = async (req, res, next) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // 🔒 Don't reveal if email exists (security best practice)
      return res.json({
        success: true,
        message: 'If this email exists and is unverified, a verification link will be sent.'
      });
    }

    // 🔒 Only unverified users can resend
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your email is already verified.'
      });
    }

    // 🔒 Check rate limit (max 3 per hour)
    const rateLimitCheck = checkResendRateLimit(user);
    if (!rateLimitCheck.allowed) {
      logger.warn(`Rate limit exceeded for resend verification: ${email}`);
      return res.status(429).json({
        success: false,
        message: rateLimitCheck.message
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.emailVerificationToken = verificationToken;
    // 🔒 Extend verification expiry by 24 hours
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update rate limiting
    if (rateLimitCheck.totallyFresh) {
      user.verificationAttempts = 1;
    } else {
      user.verificationAttempts += 1;
    }
    user.verificationLastAttempt = new Date();

    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send verification email using existing function
    await sendVerificationEmail(email, verifyUrl);

    logger.info(`Verification email resent to: ${email}`);

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    next(error);
  }

};


// ─────────────────────────────────
// Forgot Password
// ─────────────────────────────────
const forgotPassword = async (req, res, next) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: "If this email exists, a reset link will be sent."
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send reset password email
    await sendResetPasswordEmail(email, resetUrl);

    logger.info(`Password reset email sent to ${email}`);

    res.json({
      success: true,
      message: "Reset password email sent"
    });

  } catch (error) {
    next(error);
  }

};


// ─────────────────────────────────
// Reset Password
// ─────────────────────────────────
const resetPassword = async (req, res, next) => {

  try {

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    user.password = password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    logger.info(`Password reset successful for ${user.email}`);

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    next(error);
  }

};


// ─────────────────────────────────
// Get Current User
// ─────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};


module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe
};