import crypto from "crypto";
import provider from "../../configs/paymentProvider.js";
import Course from "../../models/courseModel.js";
import Order from "../../models/orderModel.js";

export const createCourseOrder = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    if (!course.is_paidCourse) {
      return res.status(400).json({
        message: "This is a free course"
      });
    }

    if (!course.price || course.price <= 0) {
      return res.status(400).json({
        message: "Invalid course price"
      });
    }

    const amountInPaise =
      Math.round(course.price * 100);

    const razorpayOrder =
      await provider.orders.create({
        amount: amountInPaise,
        currency: course.currency || "INR",
        receipt: `course_${course._id}_${Date.now()}`,
        notes: {
          courseId: course._id.toString(),
          userId: userId.toString()
        }
      });

    const order = await Order.create({
      user: userId,
      course: course._id,
      amount: course.price,
      currency: course.currency || "INR",
      paymentProvider: "razorpay",
      providerOrderId: razorpayOrder.id,
      status: "created"
    });

    res.status(201).json({
      message: "Payment order created",
      orderId: order._id,
      providerOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: course.currency || "INR",
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      message: "Unable to create payment order"
    });
  }
};

