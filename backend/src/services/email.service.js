const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────
// Email Verification
// ─────────────────────────────────
const sendVerificationEmail = async (email, verifyUrl) => {

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Verify your CyberShield account",
    html: `
      <h2>CyberShield Email Verification</h2>

      <p>Welcome to CyberShield.</p>

      <p>Please verify your email to activate your account.</p>

      <a href="${verifyUrl}" style="padding:10px 20px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;">
        Verify Email
      </a>

      <br><br>

      If you did not create this account, please ignore this email.

      <br><br>

      CyberShield Security
    `
  };

  await transporter.sendMail(mailOptions);

};


// ─────────────────────────────────
// Password Reset Email
// ─────────────────────────────────
const sendResetPasswordEmail = async (email, resetUrl) => {

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "CyberShield Password Reset",
    html: `
      <h2>Reset your CyberShield password</h2>

      <p>You requested to reset your password.</p>

      <a href="${resetUrl}" style="padding:10px 20px;background:#ef4444;color:white;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>

      <br><br>

      This link will expire in 15 minutes.

      <br><br>

      CyberShield Security
    `
  };

  await transporter.sendMail(mailOptions);

};


// ─────────────────────────────────
// Security Score Alert
// ─────────────────────────────────
const sendSecurityAlert = async (email, website, oldScore, newScore) => {

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "CyberShield Security Alert",
    html: `
      <h2>⚠ Security Score Dropped</h2>

      <p>Your website security score has decreased.</p>

      <b>Website:</b> ${website} <br>
      <b>Previous Score:</b> ${oldScore} <br>
      <b>Current Score:</b> ${newScore} <br><br>

      Please review your vulnerabilities.

      <br><br>

      CyberShield Security
    `
  };

  await transporter.sendMail(mailOptions);

};


module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendSecurityAlert
};