import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true
    },
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

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    paymentProvider: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay"
    },

    providerOrderId: {
      type: String,
      default: null,
      index: true
    },

    razorpayPaymentId: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded"
      ],
      default: "created"
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

const generateOrderId = () => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
  return `ORD-${randomNum}`;
};

orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = generateOrderId();
  }
  next();
});

export default mongoose.model("Order", orderSchema);