const Scan = require('../models/Scan.model');
const PhishingReport = require('../models/PhishingReport.model');
const ScanUsage = require('../models/ScanUsage.model');
const User = require('../models/User.model');
const { getCurrentMonthKey, MONTHLY_LIMIT } = require('../middleware/usageLimit.middleware');

// @route   GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const monthKey = getCurrentMonthKey();

    // 🔥 Fetch fresh user from DB (important)
    const user = await User.findById(userId).select('plan name email');

    const [
      totalScans,
      recentScans,
      totalPhishingReports,
      latestScan,
      highSeverityCount,
      scanUsage,
    ] = await Promise.all([
      Scan.countDocuments({ userId, status: 'completed' }),
      Scan.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('websiteUrl securityScore status createdAt summary'),
      PhishingReport.countDocuments({ userId }),
      Scan.findOne({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .select('securityScore websiteUrl createdAt summary'),
      Scan.countDocuments({
        userId,
        status: 'completed',
        $or: [
          { 'summary.high': { $gt: 0 } },
          { 'summary.critical': { $gt: 0 } },
        ],
      }),
      ScanUsage.findOne({ userId, monthKey }),
    ]);

    const scoreTrend = await Scan.find({
      userId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(7)
      .select('securityScore createdAt websiteUrl');

    const alerts = await Scan.find({
      userId,
      status: 'completed',
      $or: [
        { 'summary.critical': { $gt: 0 } },
        { 'summary.high': { $gt: 0 } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('websiteUrl summary createdAt securityScore');

    const scansUsed = scanUsage?.scanCount ?? 0;
    const scansRemaining =
      user.plan === 'pro'
        ? 'Unlimited'
        : Math.max(0, MONTHLY_LIMIT - scansUsed);

    const nextReset = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    )
      .toISOString()
      .split('T')[0];

    res.json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          email: user.email,
          plan: user.plan, // 🔥 now frontend knows real plan
        },
        stats: {
          totalScans,
          totalPhishingReports,
          lastSecurityScore: latestScan?.securityScore ?? null,
          lastScannedSite: latestScan?.websiteUrl ?? null,
          highSeverityScans: highSeverityCount,
        },
        usage: {
          scansThisMonth: scansUsed,
          scansRemaining,
          monthlyLimit: MONTHLY_LIMIT,
          resetsOn: nextReset,
        },
        recentScans,
        scoreTrend: scoreTrend.reverse(),
        alerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };