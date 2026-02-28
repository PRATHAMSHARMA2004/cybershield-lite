const mongoose = require('mongoose');

/**
 * Tracks how many scans a user has run in the current calendar month.
 * One document per user per month (upserted on each scan).
 * Used to enforce the free-tier 5 scans/month limit.
 */
const scanUsageSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    // "2026-02" — year-month key, makes monthly reset trivially queryable
    monthKey: {
      type:     String,   // format: YYYY-MM
      required: true,
    },
    scanCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  { timestamps: true }
);

// One document per user per month
scanUsageSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('ScanUsage', scanUsageSchema);
