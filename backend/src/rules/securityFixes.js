const fixes = {

  missing_content_security_policy_header: {
    description: "Content Security Policy header missing",
    fix: `add_header Content-Security-Policy "default-src 'self';";`
  },

  missing_csp: {
    description: "Content Security Policy header missing",
    fix: `add_header Content-Security-Policy "default-src 'self';";`
  },

  hsts_missing: {
    description: "HSTS header missing",
    fix: `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";`
  },

  missing_x_frame_options: {
    description: "X-Frame-Options header missing",
    fix: `add_header X-Frame-Options "SAMEORIGIN";`
  },

  missing_x_content_type_options: {
    description: "X-Content-Type-Options header missing",
    fix: `add_header X-Content-Type-Options "nosniff";`
  },

  missing_x_xss_protection: {
    description: "X-XSS-Protection header missing",
    fix: `add_header X-XSS-Protection "1; mode=block";`
  },

  server_version_exposed: {
    description: "Server version exposed",
    fix: `server_tokens off;`
  },

  directory_listing_enabled: {
    description: "Directory listing enabled",
    fix: `autoindex off;`
  },

  insecure_cookie: {
    description: "Cookie missing Secure flag",
    fix: `Set-Cookie: Secure; HttpOnly; SameSite=Strict`
  },

  weak_ssl_protocol: {
    description: "Weak SSL protocol enabled",
    fix: `ssl_protocols TLSv1.2 TLSv1.3;`
  }

};

module.exports = fixes;