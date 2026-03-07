const ScanUsage = require('../models/ScanUsage.model');
const config = require('../config');

/**
 * Middleware: Enforces monthly scan limit
 *
 * Free  → limited scans
 * Pro   → unlimited scans
 */

const MONTHLY_LIMIT = config.usage.monthlyLimit;

// Get current month key (YYYY-MM)
function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Get next reset date (1st of next month)
function getMonthResetDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

const enforceScanLimit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userPlan = req.user.plan || 'free';
    const monthKey = getCurrentMonthKey();

    // 🔥 PRO USERS → UNLIMITED ACCESS
    if (userPlan === 'pro') {
      return next();
    }

    // 🔹 FREE PLAN LOGIC
    let usage = await ScanUsage.findOne({ userId, monthKey });

    if (!usage) {
      usage = await ScanUsage.create({
        userId,
        monthKey,
        scanCount: 0,
      });
    }

    if (usage.scanCount >= MONTHLY_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Monthly scan limit reached (${MONTHLY_LIMIT} scans/month on free plan). Upgrade to Pro for unlimited scans.`,
        usage: {
          used: usage.scanCount,
          limit: MONTHLY_LIMIT,
          remaining: 0,
          resetsOn: getMonthResetDate(),
        },
      });
    }

    // Attach usage record for increment after successful scan
    req.scanUsage = usage;

    next();
  } catch (error) {
    next(error);
  }
};

// Increment usage counter (Only for Free users)
const incrementScanUsage = async (scanUsage) => {
  if (!scanUsage) return; // Skip for Pro users

  await ScanUsage.findByIdAndUpdate(scanUsage._id, {
    $inc: { scanCount: 1 },
  });
};

module.exports = {
  enforceScanLimit,
  incrementScanUsage,
  getCurrentMonthKey,
  MONTHLY_LIMIT,
};