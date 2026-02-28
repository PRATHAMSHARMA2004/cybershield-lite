const axios          = require('axios');
const PhishingReport = require('../models/PhishingReport.model');
const logger         = require('../utils/logger');
const config         = require('../config');

// @route   POST /api/phishing/analyze
const analyzePhishing = async (req, res, next) => {
  try {
    const { emailContent } = req.body;
    if (!emailContent || emailContent.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Email content required (min 10 characters)' });
    }
    if (emailContent.length > 50000) {
      return res.status(400).json({ success: false, message: 'Email content too large (max 50,000 characters)' });
    }

    let analysisResult;
    try {
      const response = await axios.post(
        `${config.services.scannerUrl}/analyze/phishing`,
        { email_content: emailContent },
        { timeout: 30000 }
      );
      analysisResult = response.data;
    } catch (err) {
      logger.error('Phishing scanner error', { message: err.message, code: err.code, stack: err.stack });
      return res.status(503).json({ success: false, message: 'Analysis service temporarily unavailable' });
    }

    const report = await PhishingReport.create({
      userId: req.user._id,
      emailContent,
      riskLevel:  analysisResult.risk_level,
      riskScore:  analysisResult.risk_score,
      analysisDetails: {
        suspiciousKeywords: analysisResult.suspicious_keywords  || [],
        extractedLinks:     analysisResult.extracted_links      || [],
        suspiciousDomains:  analysisResult.suspicious_domains   || [],
        spoofingIndicators: analysisResult.spoofing_indicators  || [],
        reasons:            analysisResult.reasons              || [],
      },
      suggestedAction: analysisResult.suggested_action,
    });

    logger.info('Phishing analysis completed', { riskLevel: report.riskLevel, userId: req.user._id });

    res.json({
      success: true,
      report: {
        id: report._id, riskLevel: report.riskLevel, riskScore: report.riskScore,
        analysisDetails: report.analysisDetails, suggestedAction: report.suggestedAction,
        createdAt: report.createdAt,
      },
    });
  } catch (error) { next(error); }
};

// @route   GET /api/phishing/history
const getPhishingHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      PhishingReport.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-emailContent'),
      PhishingReport.countDocuments({ userId: req.user._id }),
    ]);
    res.json({ success: true, reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

module.exports = { analyzePhishing, getPhishingHistory };
