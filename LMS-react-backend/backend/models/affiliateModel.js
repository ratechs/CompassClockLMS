import mongoose from "mongoose";

const affiliateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    affiliateRole: {
      type: String,
      enum: [
        "student",
        "teacher",
        "trainer",
        "institution"
      ],
      required: true
    },

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

    status: {
      type: String,
      enum: ["active", "suspended"],
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