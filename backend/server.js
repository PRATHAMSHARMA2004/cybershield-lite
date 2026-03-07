// ─── Load env FIRST ────────────────────────────────────────────────────────────
require('dotenv').config();
const validateEnv = require('./src/utils/env.validator');
validateEnv();

// ─── Imports ───────────────────────────────────────────────────────────────────
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');
const fs        = require('fs');
const path      = require('path');
const axios     = require('axios');

const config        = require('./src/config');
const connectDB     = require('./src/config/db');
const logger        = require('./src/utils/logger');
const errorHandler  = require('./src/middleware/errorHandler');

const authRoutes      = require('./src/routes/auth.routes');
const scanRoutes      = require('./src/routes/scan.routes');
const phishingRoutes  = require('./src/routes/phishing.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const reportRoutes    = require('./src/routes/report.routes');
const webhookRoutes   = require('./src/routes/webhook.routes');
const domainRoutes    = require('./src/routes/domain.routes');
const userRoutes      = require('./src/routes/user.routes');

// 🔥 Auto downgrade job
const autoDowngradeExpiredUsers = require('./src/jobs/subscription.job');
const migrateSubscriptions = require('./src/jobs/migrateSubscriptions.job');
const runAutoScan = require('./src/jobs/autoScan.job');

// ─── Ensure logs dir ───────────────────────────────────────────────────────────
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// ─── App setup ─────────────────────────────────────────────────────────────────
const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: config.services.clientUrl,
  credentials: true,
}));

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ───────────────────────────────────────────────────────────────────────────────
// 🔥 WEBHOOK RAW BODY (MUST BE BEFORE express.json())
// ───────────────────────────────────────────────────────────────────────────────
app.use('/webhook', express.raw({
  type: 'application/json',
  limit: '1mb',
}));

// ─── Normal JSON parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(morgan(config.server.isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Health endpoint ───────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const startTime = Date.now();

  const dbState  = mongoose.connection.readyState;
  const dbStatus = dbState === 1
    ? 'connected'
    : dbState === 2
    ? 'connecting'
    : 'disconnected';

  let scannerStatus = 'unknown';
  try {
    await axios.get(`${config.services.scannerUrl}/health`, { timeout: 3000 });
    scannerStatus = 'reachable';
  } catch {
    scannerStatus = 'unreachable';
  }

  const healthy = dbStatus === 'connected' && scannerStatus === 'reachable';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: config.server.env,
    latencyMs: Date.now() - startTime,
    services: {
      database: { status: dbStatus },
      scanner: { status: scannerStatus, url: config.services.scannerUrl },
    },
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/phishing', phishingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/report', reportRoutes);

// Webhook route (raw body configured above)
app.use('/webhook', webhookRoutes);

app.use('/api/domains', domainRoutes);
app.use('/api/user', userRoutes);

// ─── 404 + Error Handler ───────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(config.server.port, () => {
  logger.info('CyberShield API started', {
    port: config.server.port,
    env: config.server.env,
    scanner: config.services.scannerUrl,
    cors: config.services.clientUrl,
  });

  // 🔥 Run downgrade check once at startup
  autoDowngradeExpiredUsers();
  runAutoScan();

  // 🔥 Run downgrade check every 1 hour
  setInterval(() => {
    autoDowngradeExpiredUsers();
  }, 60 * 60 * 1000);
});

// ─── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM — graceful shutdown...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: String(reason),
  });
});

module.exports = app;