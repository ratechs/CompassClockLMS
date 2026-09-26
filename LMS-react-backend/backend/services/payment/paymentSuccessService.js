import Enrollment from "../../models/enrollmentModel.js";
import Affiliate from "../../models/affiliateModel.js";
import Commission from "../../models/commissionModel.js";
import AffiliateSetting from "../../models/affiliateSettingModel.js";
import User from "../../models/userModel.js";

export const processSuccessfulPayment = async (order) => {
  try {
    // ==========================================
    // 1. CREATE ENROLLMENT
    // ==========================================

    let enrollment = await Enrollment.findOne({
      user: order.user,
      course: order.course
    });

    if (!enrollment) {
      enrollment = await Enrollment.create({
        user: order.user,
        course: order.course,
        order: order._id,
        enrollmentType: "paid",
        status: "active",
        enrolledAt: new Date()
      });
    }

    // ==========================================
    // 2. FIND CUSTOMER
    // ==========================================

    const customer = await User.findById(order.user);

    if (!customer) {
      return {
        enrollment,
        commission: null
      };
    }

    // ==========================================
    // 3. CHECK REFERRER
    // ==========================================

    if (!customer.referredBy) {
      return {
        enrollment,
        commission: null
      };
    }

    // ==========================================
    // 4. FIND AFFILIATE
    // ==========================================

    const affiliate = await Affiliate.findOne({
      user: customer.referredBy,
      status: "active"
    });

    if (!affiliate) {
      return {
        enrollment,
        commission: null
      };
    }

    // ==========================================
    // 5. GET COMMISSION SETTINGS
    // ==========================================

    const setting = await AffiliateSetting.findOne({
      role: affiliate.affiliateRole,
      enabled: true
    });

    if (!setting) {
      return {
        enrollment,
        commission: null
      };
    }

    // ==========================================
    // 6. PREVENT DUPLICATE COMMISSION
    // ==========================================

    const existingCommission =
      await Commission.findOne({
        order: order._id
      });

    if (existingCommission) {
      return {
        enrollment,
        commission: existingCommission
      };
    }

    // ==========================================
    // 7. CALCULATE COMMISSION
    // ==========================================

    const commissionAmount =
      (order.amount * setting.commissionRate) / 100;

    // ==========================================
    // 8. CREATE COMMISSION
    // ==========================================

    const commission = await Commission.create({
      affiliate: affiliate._id,

      affiliateUser: affiliate.user,

      referredUser: customer._id,

      order: order._id,

      course: order.course,

      saleAmount: order.amount,

      commissionRate: setting.commissionRate,

      commissionAmount,

      status: "pending"
    });

    // ==========================================
    // 9. UPDATE AFFILIATE
    // ==========================================

    affiliate.conversions += 1;

    affiliate.totalEarnings += commissionAmount;

    affiliate.pendingEarnings += commissionAmount;

    await affiliate.save();

    return {
      enrollment,
      commission
    };

  } catch (error) {
    console.error(
      "Payment success processing error:",
      error
    );

    throw error;
  }
};