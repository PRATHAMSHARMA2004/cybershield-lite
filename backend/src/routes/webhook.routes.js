const express = require('express');
const router  = express.Router();
const logger  = require('../utils/logger');

/**
 * POST /webhook/razorpay
 *
 * Billing phase — not active yet.
 *
 * Raw body is preserved by the express.raw() middleware in server.js.
 * When Razorpay is wired up:
 *
 *   const crypto = require('crypto');
 *   const secret = config.razorpay.webhookSecret;
 *   const signature = req.headers['x-razorpay-signature'];
 *   const expected = crypto
 *     .createHmac('sha256', secret)
 *     .update(req.body)          // req.body is the raw Buffer here
 *     .digest('hex');
 *   if (signature !== expected) return res.status(400).json({ error: 'Invalid signature' });
 *
 * Then handle events: payment.captured, subscription.activated, etc.
 */
router.post('/razorpay', (req, res) => {
  logger.info('Webhook received (not yet active)', {
    headers: req.headers['x-razorpay-signature'] ? 'signature present' : 'no signature',
    bodyType: Buffer.isBuffer(req.body) ? 'raw buffer ✓' : typeof req.body,
    bodySize: req.body?.length,
  });

  // Return 200 so Razorpay doesn't retry during testing
  res.status(200).json({ received: true, status: 'not_active' });
});

module.exports = router;
