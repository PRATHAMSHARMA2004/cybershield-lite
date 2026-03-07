const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const User = require('../models/User.model');
const ScanUsage = require('../models/ScanUsage.model');
const logger = require('../utils/logger');

/*
  IMPORTANT:
  server.js me /webhook route ke liye express.raw() configured hona chahiye
*/

router.post('/razorpay', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error('Invalid Razorpay signature');
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(req.body.toString());

    logger.info('Razorpay webhook event', {
      type: event.event,
    });

    // =========================================================
    // 🔥 HANDLE SUBSCRIPTION ACTIVATION / CHARGE
    // =========================================================
    if (
      event.event === 'subscription.activated' ||
      event.event === 'subscription.charged'
    ) {
      const subscription = event.payload.subscription.entity;

      const userId = subscription.notes?.userId;

      if (!userId) {
        logger.error('No userId found in subscription notes');
        return res.status(200).json({ received: true });
      }

      const user = await User.findById(userId);

      if (!user) {
        logger.error('User not found for webhook', { userId });
        return res.status(200).json({ received: true });
      }

      // 🔥 Upgrade user
      user.plan = 'pro';
      user.subscriptionId = subscription.id;
      user.subscriptionStatus = subscription.status;
      user.subscriptionEndDate = new Date(subscription.current_end*1000);

      await user.save();

      // 🔥 Reset monthly usage if exists
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}`;

      await ScanUsage.findOneAndDelete({
        userId: user._id,
        monthKey,
      });

      logger.info('User upgraded to PRO via webhook', { userId });
    }

    // =========================================================
    // 🔥 HANDLE SUBSCRIPTION CANCEL
    // =========================================================
    if (event.event === 'subscription.cancelled') {
      const subscription = event.payload.subscription.entity;
      const userId = subscription.notes?.userId;

      if (userId) {
        const user = await User.findById(userId);

        if (user) {
          user.plan = 'free';
          user.subscriptionStatus = 'cancelled';
          await user.save();

          logger.info('User downgraded to FREE (subscription cancelled)', {
            userId,
          });
        }
      }
    }

    res.status(200).json({ received: true });

  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
    res.status(500).json({ success: false });
  }
});

module.exports = router;