const axios = require("axios");
const rateLimit = require("express-rate-limit");

const Scan = require("../models/Scan.model");
const Domain = require("../models/Domain.model");

const { validateURL } = require("../utils/validators");
const { incrementScanUsage } = require("../middleware/usageLimit.middleware");

const logger = require("../utils/logger");
const config = require("../config");

const { sendSecurityAlert } = require("../services/email.service");
const { generateSecurityReport } = require("../services/report.service");
const { getSecurityRecommendation } = require("../utils/securityRecommendations");


// ── Scanner health check ────────────────────────────────────
const checkScannerHealth = async () => {
  try {
    await axios.get(`${config.services.scannerUrl}/health`, {
      timeout: 5000,
    });
    return true;
  } catch (err) {
    logger.error("Scanner health check failed", err.message);
    return false;
  }
};


// ── POST /api/scan/website ──────────────────────────────────
const scanWebsite = async (req, res, next) => {

  try {

    const { url, domainId } = req.body;

    if (!url || !domainId) {
      return res.status(400).json({
        success: false,
        message: "URL and domainId are required",
      });
    }

    const urlValidation = validateURL(url);

    if (!urlValidation.valid) {
      return res.status(400).json({
        success: false,
        message: urlValidation.message,
      });
    }

    const normalizedUrl = urlValidation.normalizedUrl || url;

    const domainDoc = await Domain.findOne({
      _id: domainId,
      userId: req.user._id,
      isActive: true,
    });

    if (!domainDoc) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    const scannerUp = await checkScannerHealth();

    if (!scannerUp) {
      return res.status(503).json({
        success: false,
        message: "Scanner service is not running.",
      });
    }

    const scan = await Scan.create({
      userId: req.user._id,
      domainId,
      websiteUrl: url,
      status: "running",
      userPlan: req.user.plan,
    });

    if (req.scanUsage) {
      await incrementScanUsage(req.scanUsage);
    }

    logger.info("Scan initiated", {
      url,
      scanId: scan._id,
      userId: req.user._id,
      domainId,
    });

    res.status(202).json({
      success: true,
      message: "Scan initiated",
      scanId: scan._id,
    });

    const startTime = Date.now();

    try {

      const response = await axios.post(
        `${config.services.scannerUrl}/scan`,
        {
          url: normalizedUrl,
          scan_id: scan._id.toString(),
        },
        {
          timeout: 180000,
        }
      );

      const result = response?.data || {};

      // ── Security Score Drop Alert ─────────────────────
      const lastScan = await Scan.findOne({
        domainId: domainDoc._id,
        status: "completed",
        _id: { $ne: scan._id }
      }).sort({ createdAt: -1 });

      if (lastScan && lastScan.securityScore > result.score) {

        const drop = lastScan.securityScore - result.score;

        if (drop >= 10) {

          try {

            await sendSecurityAlert(
              req.user.email,
              normalizedUrl,
              lastScan.securityScore,
              result.score
            );

            logger.info("Security alert email sent");

          } catch (mailError) {

            logger.error("Email sending failed", mailError.message);

          }

        }

      }

      const duration = Math.round((Date.now() - startTime) / 1000);

      // ── Build summary ─────────────────────────────
      const summary = {
        critical: result?.issues?.critical?.length || 0,
        high: result?.issues?.high?.length || 0,
        medium: result?.issues?.medium?.length || 0,
        low: result?.issues?.low?.length || 0,
      };

      const vulnerabilities = [
        ...(result?.issues?.critical || []),
        ...(result?.issues?.high || []),
        ...(result?.issues?.medium || []),
        ...(result?.issues?.low || [])
      ].map(issue => ({
        ...issue,
        recommendation: getSecurityRecommendation(issue.title|| "")
      }));

      const previousScan = await Scan.findOne({
        userId: req.user._id,
        domainId,
        status: "completed",
        _id: { $ne: scan._id },
      }).sort({ createdAt: -1 });

      const previousScore = previousScan
        ? previousScan.securityScore
        : null;

      const scoreChange =
        previousScore !== null
          ? (result.score || 0) - previousScore
          : 0;

      await Scan.findByIdAndUpdate(scan._id, {
        status: "completed",
        securityScore: result.score || 0,
        previousScore,
        scoreChange,
        vulnerabilities,
        summary,
        sslInfo: result.ssl || {},
        headers: result.headers || {},
        openPorts: result.open_ports || [],
        technologies: result.technologies || [],
        scanDuration: duration,
      });

      // ── PDF Report Generate ─────────────────────────
      try {

        const savedScan = await Scan.findById(scan._id);

        const reportFile = generateSecurityReport(savedScan);

        logger.info("Security PDF report generated", {
          file: reportFile,
        });

      } catch (reportError) {

        logger.error("Report generation failed", reportError.message);

      }

      logger.info("Scan completed", {
        url,
        score: result.score,
        previousScore,
        scoreChange,
        duration,
      });

    } catch (scanError) {

      const isUnreachable = ["ECONNREFUSED", "ENOTFOUND"].includes(
        scanError.code
      );

      const isTimeout = scanError.code === "ECONNABORTED";

      logger.error("Scanner error", {
        url,
        scanId: scan._id,
        code: scanError.code,
        message: scanError.message,
      });

      await Scan.findByIdAndUpdate(scan._id, {
        status: "failed",
        errorMessage: isUnreachable
          ? "Scanner service stopped during scan."
          : isTimeout
          ? "Scan timed out. Target may be unreachable."
          : "Scan failed due to an unexpected error.",
      });

    }

  } catch (error) {
    next(error);
  }

};


// ── GET /api/scan/:scanId ───────────────────────────────────
const getScanResult = async (req, res, next) => {

  try {

    const scanId = req.params.scanId.trim();

    const scan = await Scan.findOne({
      _id: scanId,
      userId: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    res.json({
      success: true,
      scan,
    });

  } catch (error) {
    next(error);
  }

};


// ── GET /api/scan/history ───────────────────────────────────
const getScanHistory = async (req, res, next) => {

  try {

    const userPlan = req.user.plan;

    const page = parseInt(req.query.page) || 1;

    const limit =
      userPlan === "pro"
        ? parseInt(req.query.limit) || 10
        : 5;

    const skip =
      userPlan === "pro"
        ? (page - 1) * limit
        : 0;

    const query = {
      userId: req.user._id,
    };

    const [scans, total] = await Promise.all([
      Scan.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-vulnerabilities"),
      Scan.countDocuments(query),
    ]);

    res.json({
      success: true,
      scans,
      pagination: {
        page: userPlan === "pro" ? page : 1,
        limit,
        total: userPlan === "pro" ? total : Math.min(total, 5),
        pages:
          userPlan === "pro"
            ? Math.ceil(total / limit)
            : 1,
      },
    });

  } catch (error) {
    next(error);
  }

};


// ── Hourly Rate Limiter ─────────────────────────────────────
const scanRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: config.rateLimit.scanMaxPerHr,
  message: {
    success: false,
    message: `Max ${config.rateLimit.scanMaxPerHr} scans per hour.`,
  },
  keyGenerator: (req) =>
    req.user?._id?.toString() || req.ip,
});


module.exports = {
  scanWebsite,
  getScanResult,
  getScanHistory,
  scanRateLimiter,
};