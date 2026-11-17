import Affiliate from "../../models/affiliateModel.js";
import AffiliateSetting from "../../models/affiliateSettingModel.js";
import Referral from "../../models/refferalModel.js";
import Commission from "../../models/commissionModel.js";

export const createAffiliateCommission = async (
  order
) => {
  try {
    if (!order?.user) {
      return null;
    }

    // ==========================================
    // FIND REFERRAL
    // ==========================================

    const referral =
      await Referral.findOne({
        referredUser: order.user
      });

    if (!referral) {
      return null;
    }

    // ==========================================
    // FIND AFFILIATE
    // ==========================================

    const affiliate =
      await Affiliate.findById(
        referral.affiliate
      );

    if (!affiliate) {
      return null;
    }

    if (affiliate.status !== "active") {
      return null;
    }

    // ==========================================
    // PREVENT DUPLICATE COMMISSION
    // ==========================================

    const existingCommission =
      await Commission.findOne({
        order: order._id
      });

    if (existingCommission) {
      return existingCommission;
    }

    // ==========================================
    // GET COMMISSION SETTINGS
    // ==========================================

    const setting =
      await AffiliateSetting.findOne({
        role: affiliate.affiliateRole,
        enabled: true
      });

    if (!setting) {
      return null;
    }

    const saleAmount =
      Number(order.amount || 0);

    const commissionRate =
      Number(setting.commissionRate || 0);

    const commissionAmount =
      Number(
        (
          saleAmount *
          commissionRate /
          100
        ).toFixed(2)
      );

    if (commissionAmount <= 0) {
      return null;
    }

    // ==========================================
    // CREATE COMMISSION
    // ==========================================

    const commission =
      await Commission.create({
        affiliate:
          affiliate._id,

        affiliateUser:
          affiliate.user,

        referredUser:
          order.user,

        order:
          order._id,

        course:
          order.course,

        saleAmount,

        commissionRate,

        commissionAmount,

        status: "pending"
      });

    // ==========================================
    // UPDATE AFFILIATE
    // ==========================================

    affiliate.conversions += 1;

    affiliate.totalEarnings +=
      commissionAmount;

    affiliate.pendingEarnings +=
      commissionAmount;

    await affiliate.save();

    return commission;

  } catch (error) {
    console.error(
      "createAffiliateCommission error:",
      error
    );

    throw error;
  }
};