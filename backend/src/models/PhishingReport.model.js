const mongoose = require('mongoose');

const phishingReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emailContent: {
      type: String,
      required: [true, 'Email content is required'],
      maxlength: 50000,
    },
    riskLevel: {
      type: String,
      enum: ['safe', 'suspicious', 'high_risk'],
      required: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    analysisDetails: {
      suspiciousKeywords: [String],
      extractedLinks: [String],
      suspiciousDomains: [String],
      spoofingIndicators: [String],
      reasons: [String],
    },
    suggestedAction: { type: String },
  },
  {
    timestamps: true,
  }
);

phishingReportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PhishingReport', phishingReportSchema);
