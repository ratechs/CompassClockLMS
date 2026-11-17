import crypto from "crypto";

import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import Course from "../../models/courseModel.js";

import {
  processSuccessfulPayment
} from "../../services/payment/paymentSuccessService.js";


export const verifyCoursePayment = async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;


    // =====================================================
    // 1. VALIDATE REQUEST
    // =====================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        message: "Payment verification data is incomplete"
      });
    }


    // =====================================================
    // 2. FIND ORDER
    // =====================================================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }


    // =====================================================
    // 3. CHECK RAZORPAY ORDER ID
    // =====================================================

    if (
      order.providerOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        message: "Invalid payment order"
      });
    }


    // =====================================================
    // 4. GENERATE RAZORPAY SIGNATURE
    // =====================================================

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


    // =====================================================
    // 5. VERIFY SIGNATURE
    // =====================================================

    if (
      expectedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        message: "Invalid payment signature"
      });
    }


    // =====================================================
    // 6. IF ALREADY PAID
    // =====================================================
    // Important:
    // Even if the order is already paid, we still make sure
    // the user has the course in User.courses.
    // =====================================================

    if (order.status === "paid") {

      try {

        if (order.user && order.course) {

          await User.findByIdAndUpdate(
            order.user,
            {
              $addToSet: {
                courses: order.course
              }
            },
            {
              new: true
            }
          );

        }

      } catch (userUpdateError) {

        console.error(
          "User course update error:",
          userUpdateError
        );

      }


      return res.status(200).json({
        message: "Payment already processed",

        orderId: order._id,

        orderStatus: "paid",

        paymentId:
          order.razorpayPaymentId,

        courseId:
          order.course || null,

        userId:
          order.user || null,

        access: true
      });
    }


    // =====================================================
    // 7. UPDATE ORDER AS PAID
    // =====================================================

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.status = "paid";

    order.paidAt = new Date();

    await order.save();


    // =====================================================
    // 8. PROCESS SUCCESSFUL PAYMENT
    // =====================================================
    // This should create the Enrollment and commission.
    // =====================================================

    const result =
      await processSuccessfulPayment(order);


    // =====================================================
    // 9. GET COURSE ID
    // =====================================================

    const courseId =
      order.course ||
      result?.enrollment?.course;


    // =====================================================
    // 10. UPDATE USER COURSES
    // =====================================================
    // $addToSet prevents duplicate course IDs.
    // =====================================================

    let updatedUser = null;

    if (order.user && courseId) {

      updatedUser =
        await User.findByIdAndUpdate(
          order.user,

          {
            $addToSet: {
              courses: courseId
            }
          },

          {
            new: true
          }
        ).select("_id courses");
    }


    // =====================================================
    // 11. VERIFY COURSE EXISTS
    // =====================================================

    let courseExists = false;

    if (courseId) {

      courseExists =
        !!await Course.exists({
          _id: courseId
        });

    }


    // =====================================================
    // 12. FINAL RESPONSE
    // =====================================================

    return res.status(200).json({

      message: "Payment successful",

      orderId:
        order._id,

      orderStatus:
        order.status,

      paymentId:
        order.razorpayPaymentId,

      userId:
        order.user,

      courseId:
        courseId,

      enrollment:
        result?.enrollment
          ? result.enrollment._id
          : null,

      commissionCreated:
        !!result?.commission,

      courseAddedToUser:
        !!(
          updatedUser &&
          courseId &&
          updatedUser.courses.some(
            id =>
              id.toString() ===
              courseId.toString()
          )
        ),

      courseExists,

      access: true

    });


  } catch (error) {

    console.error(
      "Verify payment error:",
      error
    );

    return res.status(500).json({

      message:
        "Payment verification failed",

      error:
        error.message

    });

  }
};