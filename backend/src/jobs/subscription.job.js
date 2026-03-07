const User = require('../models/User.model');
const logger = require('../utils/logger');

async function autoDowngradeExpiredUsers() {
  try {
    const now = new Date();

    // Find expired PRO users
    const expiredUsers = await User.find({
      plan: 'pro',
      subscriptionEndDate: { $lt: now }
    });

    if (!expiredUsers.length) {
      logger.info('No expired subscriptions found.');
      return;
    }

    for (const user of expiredUsers) {
      user.plan = 'free';
      user.subscriptionStatus = 'expired';
      user.subscriptionId = null;
      user.subscriptionEndDate = null;

      await user.save();

      logger.info('User downgraded to FREE', { email: user.email });
    }

  } catch (error) {
    logger.error('Auto downgrade error', { error: error.message });
  }
}

module.exports = autoDowngradeExpiredUsers;