import mongoose from "mongoose";

const affiliateSettingSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: [
        "student",
        "teacher",
        "admin",
        "coordinator",
      ],
      required: true,
      unique: true
    },

    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "AffiliateSetting",
  affiliateSettingSchema
);