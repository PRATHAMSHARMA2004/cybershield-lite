const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSecurityAlert = async (email, website, oldScore, newScore) => {

  const mailOptions = {
    from: process.env.EMAIL_USER,
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

module.exports = { sendSecurityAlert };