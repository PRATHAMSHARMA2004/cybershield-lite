const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String, // optional friendly name like "Main Website"
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "agency"],
      default: "free",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One user cannot add same domain twice
domainSchema.index({ userId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model("Domain", domainSchema);