import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    affiliate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true
    },

    affiliateUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    saleAmount: {
      type: Number,
      required: true
    },

    commissionRate: {
      type: Number,
      required: true
    },

    commissionAmount: {
      type: Number,
      required: true
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