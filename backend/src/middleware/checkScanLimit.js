const User = require("../models/User.model");

const checkScanLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.scansUsed >= user.scanLimit) {
      return res.status(403).json({
        success: false,
        message: "Scan limit reached. Upgrade your plan."
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = checkScanLimit;