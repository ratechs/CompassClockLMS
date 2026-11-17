import mongoose from "mongoose";

const affiliateSettingSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: [
        "student",
        "teacher",
        "trainer",
        "institution",
        "admin"
      ],
      required: true,
      unique: true
    },

    commissionRate: {
      type: Number,
      default: 10,
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