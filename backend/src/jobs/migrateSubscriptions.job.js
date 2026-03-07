const User = require('../models/User.model');
const logger = require('../utils/logger');

async function migrateSubscriptions() {
  try {
    logger.info('Starting subscription migration...');

    const users = await User.find({
      $or: [
        { subscriptionId: { $exists: false } },
        { subscriptionStatus: { $exists: false } },
        { subscriptionEndDate: { $exists: false } }
      ]
    });

    if (!users.length) {
      logger.info('No users require migration.');
      return;
    }

    for (const user of users) {
      // Add missing fields safely
      if (!user.subscriptionId) user.subscriptionId = null;
      if (!user.subscriptionStatus) {
        user.subscriptionStatus = user.plan === 'pro' ? 'active' : null;
      }
      if (!user.subscriptionStartDate) user.subscriptionStartDate = null;
      if (!user.subscriptionEndDate) user.subscriptionEndDate = null;

      await user.save();
    }

    logger.info(`Migration completed. ${users.length} users updated.`);
  } catch (error) {
    logger.error('Migration error', { error: error.message });
  }
}

module.exports = migrateSubscriptions;