const mongoose = require('mongoose');

const vulnerabilitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  category: { type: String },
  recommendation: { type: String },
  evidence: { type: String },
});

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    websiteUrl: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    securityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    vulnerabilities: [vulnerabilitySchema],
    summary: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    sslInfo: {
      valid: Boolean,
      issuer: String,
      expiryDate: Date,
      daysUntilExpiry: Number,
    },
    headers: {
      missing: [String],
      present: [String],
    },
    openPorts: [Number],
    technologies: [String],
    scanDuration: { type: Number }, // in seconds
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
scanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
