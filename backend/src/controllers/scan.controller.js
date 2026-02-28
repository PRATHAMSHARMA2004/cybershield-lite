const axios      = require('axios');
const rateLimit  = require('express-rate-limit');
const Scan       = require('../models/Scan.model');
const { validateURL }             = require('../utils/validators');
const { incrementScanUsage }      = require('../middleware/usageLimit.middleware');
const logger     = require('../utils/logger');
const config     = require('../config');

// ── Pre-flight: check scanner is reachable before creating a scan record ───────
const checkScannerHealth = async () => {
  try {
    await axios.get(`${config.services.scannerUrl}/health`, { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
};

// @route   POST /api/scan/website
const scanWebsite = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    const urlValidation = validateURL(url);
    if (!urlValidation.valid) {
      return res.status(400).json({ success: false, message: urlValidation.message });
    }

    // Pre-flight: fail fast if scanner is down — before creating a DB record
    const scannerUp = await checkScannerHealth();
    if (!scannerUp) {
      return res.status(503).json({
        success: false,
        message: 'Scanner service is not running. Start it with: cd scanner && python app.py',
      });
    }

    // Create scan record
    const scan = await Scan.create({ userId: req.user._id, websiteUrl: url, status: 'running' });

    // Increment monthly usage counter (req.scanUsage set by enforceScanLimit middleware)
    if (req.scanUsage) await incrementScanUsage(req.scanUsage);

    logger.info('Scan initiated', { url, scanId: scan._id, userId: req.user._id });

    // Respond immediately — scanning is async
    res.status(202).json({ success: true, message: 'Scan initiated', scanId: scan._id });

    // ── Async scan ─────────────────────────────────────────────────────────────
    const startTime = Date.now();
    try {
      const response = await axios.post(
        `${config.services.scannerUrl}/scan`,
        { url, scan_id: scan._id.toString() },
        { timeout: 120000 }
      );

      const result   = response.data;
      const duration = Math.round((Date.now() - startTime) / 1000);
      const summary  = { critical: 0, high: 0, medium: 0, low: 0 };
      result.vulnerabilities?.forEach((v) => {
        if (summary[v.severity] !== undefined) summary[v.severity]++;
      });

      await Scan.findByIdAndUpdate(scan._id, {
        status: 'completed', securityScore: result.security_score,
        vulnerabilities: result.vulnerabilities || [], summary,
        sslInfo: result.ssl_info, headers: result.headers,
        openPorts: result.open_ports || [], technologies: result.technologies || [],
        scanDuration: duration,
      });

      logger.info('Scan completed', { url, score: result.security_score, duration });

    } catch (scanError) {
      const isUnreachable = ['ECONNREFUSED', 'ENOTFOUND'].includes(scanError.code);
      const isTimeout     = scanError.code === 'ECONNABORTED';

      logger.error('Scanner error', {
        url, scanId: scan._id,
        code: scanError.code, message: scanError.message,
        response: scanError.response?.data, stack: scanError.stack,
      });

      await Scan.findByIdAndUpdate(scan._id, {
        status: 'failed',
        errorMessage: isUnreachable ? 'Scanner service stopped during scan.'
          : isTimeout ? 'Scan timed out. Target may be unreachable.'
          : 'Scan failed due to an unexpected error.',
      });
    }
  } catch (error) { next(error); }
};

// @route   GET /api/scan/:scanId
const getScanResult = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.scanId, userId: req.user._id });
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
    res.json({ success: true, scan });
  } catch (error) { next(error); }
};

// @route   GET /api/scan/history
const getScanHistory = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const [scans, total] = await Promise.all([
      Scan.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-vulnerabilities'),
      Scan.countDocuments({ userId: req.user._id }),
    ]);
    res.json({ success: true, scans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

// Per-user hourly scan rate limiter (separate from monthly limit)
const scanRateLimiter = rateLimit({
  windowMs:     60 * 60 * 1000,
  max:          config.rateLimit.scanMaxPerHr,
  message:      { success: false, message: `Max ${config.rateLimit.scanMaxPerHr} scans per hour.` },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

module.exports = { scanWebsite, getScanResult, getScanHistory, scanRateLimiter };
