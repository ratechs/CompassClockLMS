import Enrollment from "../../models/enrollmentModel.js";
import User from "../../models/userModel.js";

import {
  createAffiliateCommission
} from "./affiliateCommissionService.js";


// ======================================================
// PROCESS SUCCESSFUL PAYMENT
// ======================================================

export const processSuccessfulPayment = async (order) => {
  try {

    if (!order?._id) {
      throw new Error("Order is required");
    }

    if (!order?.user) {
      throw new Error("Order user is required");
    }

    if (!order?.course) {
      throw new Error("Order course is required");
    }


    // ==================================================
    // 1. FIND EXISTING ENROLLMENT
    // ==================================================

    let enrollment = await Enrollment.findOne({
      user: order.user,
      course: order.course
    });


    // ==================================================
    // 2. CREATE / ACTIVATE ENROLLMENT
    // ==================================================

    if (!enrollment) {

      enrollment = await Enrollment.create({
        user: order.user,
        course: order.course,
        order: order._id,
        enrollmentType: "paid",
        status: "active",
        enrolledAt: new Date()
      });

    } else {

      enrollment.order = order._id;

      enrollment.enrollmentType = "paid";

      enrollment.status = "active";

      await enrollment.save();
    }


    // ==================================================
    // 3. ADD COURSE TO USER COURSES
    // ==================================================

    await User.findByIdAndUpdate(
      order.user,
      {
        $addToSet: {
          courses: order.course
        }
      }
    );


    // ==================================================
    // 4. CREATE AFFILIATE COMMISSION
    // ==================================================

    let commission = null;

    try {

      commission =
        await createAffiliateCommission(order);

    } catch (affiliateError) {

      // Affiliate failure should NOT undo
      // successful enrollment.

      console.error(
        "Affiliate commission error:",
        affiliateError
      );

    }


    // ==================================================
    // 5. RETURN RESULT
    // ==================================================

    return {
      enrollment,
      commission
    };

  } catch (error) {

    console.error(
      "processSuccessfulPayment error:",
      error
    );

    throw error;
  }
};