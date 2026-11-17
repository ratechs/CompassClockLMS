import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    saleAmount: {
      type: Number,
      required: true,
      min:0
    },

    commissionRate: {
      type: Number,
      required: true,
      min:0,
      max: 100,
    },

    commissionAmount: {
      type: Number,
      required: true,
      min:0
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "paid",
        "cancelled"
      ],
      default: "pending"
    },

    paidAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Commission", commissionSchema);