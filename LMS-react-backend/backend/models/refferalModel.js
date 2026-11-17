import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    affiliate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
      index: true
    },

    affiliateUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    referralCode: {
      type: String,
      required: true,
      index: true
    },

    registeredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Referral",
  referralSchema
);