const getSecurityRecommendation = (issueTitle) => {

  const title = issueTitle.toLowerCase();

  if (title.includes("content security policy")) {
    return "Add a Content-Security-Policy header to prevent XSS attacks.";
  }

  if (title.includes("hsts")) {
    return "Enable Strict-Transport-Security header to enforce HTTPS.";
  }

  if (title.includes("x-frame-options")) {
    return "Add X-Frame-Options header to prevent clickjacking attacks.";
  }

  if (title.includes("open port")) {
    return "Restrict unnecessary open ports using firewall rules.";
  }

  if (title.includes("tls")) {
    return "Upgrade TLS configuration to use TLS 1.2 or TLS 1.3.";
  }

  if (title.includes("ssl")) {
    return "Ensure SSL certificate is valid and properly configured.";
  }

  return "Review the configuration and follow security best practices.";

};

module.exports = { getSecurityRecommendation };