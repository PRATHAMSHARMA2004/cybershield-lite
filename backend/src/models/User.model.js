const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    // ==========================
    // 🔥 BILLING SECTION
    // ==========================

    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },

    subscriptionId: {
      type: String,
    },

    subscriptionStatus: {
      type: String, // active, cancelled, completed, etc.
    },

    subscriptionStartDate: {
      type: Date,
    },

    subscriptionEndDate: {
      type: Date,
    },

    // ==========================
    // Usage Control
    // ==========================

    scanLimit: {
      type: Number,
      default: 5,
    },

    scansUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// Password Hash
// ==========================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ==========================
// Compare Password
// ==========================
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ==========================
// Remove Sensitive Fields
// ==========================
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);