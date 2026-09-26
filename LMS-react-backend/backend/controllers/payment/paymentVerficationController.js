import crypto from "crypto";

import Order from "../../models/orderModel.js";

import {
  processSuccessfulPayment
} from "../../services/payment/paymentSuccessService.js";

export const verifyCoursePayment = async (
  req,
  res
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // ==========================================
    // 1. FIND ORDER
    // ==========================================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // ==========================================
    // 2. CHECK RAZORPAY ORDER ID
    // ==========================================

    if (
      order.providerOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        message: "Invalid payment order"
      });
    }

    // ==========================================
    // 3. GENERATE SIGNATURE
    // ==========================================

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

    // ==========================================
    // 4. VERIFY SIGNATURE
    // ==========================================

    if (
      expectedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        message: "Invalid payment signature"
      });
    }

    // ==========================================
    // 5. PREVENT DUPLICATE PROCESSING
    // ==========================================

    if (order.status === "paid") {
      return res.status(200).json({
        message: "Payment already processed"
      });
    }

    // ==========================================
    // 6. UPDATE ORDER
    // ==========================================

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.status = "paid";

    order.paidAt = new Date();

    await order.save();

    // ==========================================
    // 7. ENROLL + COMMISSION
    // ==========================================

    const result =
      await processSuccessfulPayment(order);

    // ==========================================
    // 8. RESPONSE
    // ==========================================

    return res.status(200).json({
      message: "Payment successful",

      orderId: order._id,

      orderStatus: order.status,

      paymentId: order.razorpayPaymentId,

      enrollment: result.enrollment
        ? result.enrollment._id
        : null,

      commissionCreated:
        !!result.commission
    });

  } catch (error) {
    console.error(
      "Verify payment error:",
      error
    );

    return res.status(500).json({
      message: "Payment verification failed",
      error: error.message
    });
  }
};