import mongoose from "mongoose";

const affiliateSchema = new mongoose.Schema(
  {
    // ==========================================
    // AFFILIATE USER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // ==========================================
    // REFERRAL
    // ==========================================

    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },

    referralLink: {
      type: String,
      default: null
    },

    // ==========================================
    // AFFILIATE ROLE
    // ==========================================

    affiliateRole: {
      type: String,
      enum: [
        "student",
        "teacher",
        "trainer",
        "institution",
        "admin"
      ],
      required: true
    },

    // ==========================================
    // STATISTICS
    // ==========================================

    clicks: {
      type: Number,
      default: 0
    },

    registrations: {
      type: Number,
      default: 0
    },

    conversions: {
      type: Number,
      default: 0
    },

    // ==========================================
    // EARNINGS
    // ==========================================

    totalEarnings: {
      type: Number,
      default: 0
    },

    pendingEarnings: {
      type: Number,
      default: 0
    },

    paidEarnings: {
      type: Number,
      default: 0
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "active",
        "suspended"
      ],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Affiliate",
  affiliateSchema
);