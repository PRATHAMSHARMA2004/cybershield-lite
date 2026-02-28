const Scan        = require('../models/Scan.model');
const PhishingReport = require('../models/PhishingReport.model');
const ScanUsage   = require('../models/ScanUsage.model');
const { getCurrentMonthKey, MONTHLY_LIMIT } = require('../middleware/usageLimit.middleware');

// @route   GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId   = req.user._id;
    const monthKey = getCurrentMonthKey();

    const [
      totalScans, recentScans, totalPhishingReports,
      latestScan, highSeverityCount, scanUsage,
    ] = await Promise.all([
      Scan.countDocuments({ userId, status: 'completed' }),
      Scan.find({ userId }).sort({ createdAt: -1 }).limit(5)
        .select('websiteUrl securityScore status createdAt summary'),
      PhishingReport.countDocuments({ userId }),
      Scan.findOne({ userId, status: 'completed' }).sort({ createdAt: -1 })
        .select('securityScore websiteUrl createdAt summary'),
      Scan.countDocuments({
        userId, status: 'completed',
        $or: [{ 'summary.high': { $gt: 0 } }, { 'summary.critical': { $gt: 0 } }],
      }),
      // Monthly usage for free-tier meter
      ScanUsage.findOne({ userId, monthKey }),
    ]);

    // Score trend (last 7 completed scans)
    const scoreTrend = await Scan.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 }).limit(7).select('securityScore createdAt websiteUrl');

    // Active alerts
    const alerts = await Scan.find({
      userId, status: 'completed',
      $or: [{ 'summary.critical': { $gt: 0 } }, { 'summary.high': { $gt: 0 } }],
    }).sort({ createdAt: -1 }).limit(3).select('websiteUrl summary createdAt securityScore');

    // Usage meter values
    const scansUsed      = scanUsage?.scanCount ?? 0;
    const scansRemaining = Math.max(0, MONTHLY_LIMIT - scansUsed);
    const nextReset      = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      .toISOString().split('T')[0];

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalScans,
          totalPhishingReports,
          lastSecurityScore: latestScan?.securityScore ?? null,
          lastScannedSite:   latestScan?.websiteUrl    ?? null,
          highSeverityScans: highSeverityCount,
        },
        // Free-tier usage meter — shown in dashboard UI
        usage: {
          scansThisMonth: scansUsed,
          scansRemaining,
          monthlyLimit:   MONTHLY_LIMIT,
          resetsOn:       nextReset,
        },
        recentScans,
        scoreTrend: scoreTrend.reverse(),
        alerts,
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getDashboard };
