/**
 * config/index.js
 *
 * Single source of truth for all application configuration.
 * Every module imports from here — never from process.env directly.
 * This file assumes env.validator.js has already run (called in server.js).
 */

const config = {
  // ── Server ──────────────────────────────────────────────────────
  server: {
    port:    parseInt(process.env.PORT, 10),
    env:     process.env.NODE_ENV,
    isProd:  process.env.NODE_ENV === 'production',
    isDev:   process.env.NODE_ENV === 'development',
  },

  // ── Database ─────────────────────────────────────────────────────
  db: {
    uri: process.env.MONGO_URI,
  },

  // ── Authentication ────────────────────────────────────────────────
  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // ── Services ──────────────────────────────────────────────────────
  services: {
    scannerUrl: process.env.SCANNER_SERVICE_URL,
    clientUrl:  process.env.CLIENT_URL,
  },

  // ── Rate Limiting ─────────────────────────────────────────────────
  rateLimit: {
    windowMs:     parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max:          parseInt(process.env.RATE_LIMIT_MAX, 10)        || 100,
    scanMaxPerHr: parseInt(process.env.SCAN_RATE_LIMIT_MAX, 10)   || 10,
  },

  // ── Logging ───────────────────────────────────────────────────────
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // ── Usage / Free Tier ─────────────────────────────────────────────
  usage: {
    monthlyLimit: parseInt(process.env.SCAN_MONTHLY_LIMIT, 10) || 5,
  },
};

module.exports = config;
