const ScanUsage = require('../models/ScanUsage.model');
const config    = require('../config');

/**
 * Middleware: enforces the monthly scan limit for free-tier users.
 *
 * - Reads SCAN_MONTHLY_LIMIT from config (default: 5)
 * - Uses a YYYY-MM monthKey so limits reset automatically each month
 * - Returns 403 with remaining count if limit exceeded
 * - Attaches `req.scanUsage` so the scan controller can increment after success
 */
const MONTHLY_LIMIT = config.usage.monthlyLimit;

function getCurrentMonthKey() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const enforceScanLimit = async (req, res, next) => {
  try {
    const userId   = req.user._id;
    const monthKey = getCurrentMonthKey();

    // Find or create usage record for this user+month
    let usage = await ScanUsage.findOne({ userId, monthKey });

    if (!usage) {
      usage = await ScanUsage.create({ userId, monthKey, scanCount: 0 });
    }

    if (usage.scanCount >= MONTHLY_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Monthly scan limit reached (${MONTHLY_LIMIT} scans/month on free plan).`,
        usage: {
          used:      usage.scanCount,
          limit:     MONTHLY_LIMIT,
          remaining: 0,
          resetsOn:  getMonthResetDate(),
        },
      });
    }

    // Attach to request so controller can increment after scan is created
    req.scanUsage = usage;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Call this after a scan is successfully created to increment the counter.
 */
const incrementScanUsage = async (scanUsage) => {
  await ScanUsage.findByIdAndUpdate(scanUsage._id, { $inc: { scanCount: 1 } });
};

/**
 * Returns the ISO date string for the first day of next month.
 */
function getMonthResetDate() {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString().split('T')[0];
}

module.exports = { enforceScanLimit, incrementScanUsage, getCurrentMonthKey, MONTHLY_LIMIT };
