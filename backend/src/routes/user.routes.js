const express = require("express");
const router = express.Router();
const razorpay = require("../utils/razorpay");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.middleware");

const User = require("../models/User.model");
const ScanUsage = require("../models/ScanUsage.model");

/* =========================================================
   🔹 CREATE SUBSCRIPTION (PRO PLAN)
========================================================= */
router.post("/create-subscription", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID, // 🔥 .env me rakho
      customer_notify: 1,
      total_count: 12,
      notes: {
        userId: user._id.toString(), // 🔥 IMPORTANT
      },
    });

    res.status(200).json({
      success: true,
      subscription,
    });

  } catch (error) {
    console.error("Subscription creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Subscription creation failed",
    });
  }
});

/* =========================================================
   🔹 OPTIONAL: VERIFY INITIAL PAYMENT (Safety Layer)
   (Webhook main source hoga upgrade ka)
========================================================= */
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    const crypto = require("crypto");

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Subscription verification failed",
      });
    }

    res.json({
      success: true,
      message: "Payment verified. Waiting for webhook confirmation.",
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================================================
   🔹 ADMIN UPGRADE ANY USER
========================================================= */
router.post("/admin/upgrade-user", protect, adminOnly, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.plan = "pro";
    await user.save();

    res.json({
      success: true,
      message: `User ${email} upgraded to PRO`,
      plan: user.plan,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;