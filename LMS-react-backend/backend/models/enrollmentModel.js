import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    enrollmentType: {
      type: String,
      enum: ["free", "paid", "admin"],
      default: "free"
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active"
    },

    enrolledAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

enrollmentSchema.index(
  { user: 1, course: 1 },
  { unique: true }
);

export default mongoose.model("Enrollment", enrollmentSchema);