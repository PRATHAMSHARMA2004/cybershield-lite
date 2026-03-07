const Domain = require("../models/Domain.model");

// ── Normalize domain ─────────────────────────────────────
const normalizeDomain = (url) => {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
};


// @route   POST /api/domains
// @desc    Add new domain
exports.addDomain = async (req, res, next) => {
  try {

    let { domain, label } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is required",
      });
    }

    // Normalize domain
    domain = normalizeDomain(domain);

    // Check if domain already exists
    const existing = await Domain.findOne({
      userId: req.user._id,
      domain,
    });

    // If exists → return existing (no error)
    if (existing) {
      return res.json({
        success: true,
        domain: existing,
        message: "Domain already exists. Using existing record.",
      });
    }

    // Create new domain
    const newDomain = await Domain.create({
      userId: req.user._id,
      domain,
      label,
    });

    res.status(201).json({
      success: true,
      domain: newDomain,
    });

  } catch (error) {
    next(error);
  }
};


// @route   GET /api/domains
// @desc    Get user's domains
exports.getDomains = async (req, res, next) => {
  try {

    const domains = await Domain.find({
      userId: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      domains,
    });

  } catch (error) {
    next(error);
  }
};