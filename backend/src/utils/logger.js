/**
 * utils/logger.js
 *
 * Dev  → colorized, human-readable output to console
 * Prod → structured JSON to console + rotating log files
 *        (JSON is what Datadog, CloudWatch, Grafana Loki expect)
 */

const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';
const level  = process.env.LOG_LEVEL || 'info';

// ── Formats ───────────────────────────────────────────────────────────────────

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length
      ? '\n' + JSON.stringify(meta, null, 2)
      : '';
    return `${timestamp} [${level}] ${message}${extra}`;
  })
);

// ── Transports ────────────────────────────────────────────────────────────────

const transports = [
  new winston.transports.Console({
    format: isProd ? jsonFormat : prettyFormat,
  }),
];

if (isProd) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level:    'error',
      format:   jsonFormat,
      maxsize:  5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format:   jsonFormat,
      maxsize:  10 * 1024 * 1024,
      maxFiles: 10,
    })
  );
}

const logger = winston.createLogger({ level, transports });

module.exports = logger;
