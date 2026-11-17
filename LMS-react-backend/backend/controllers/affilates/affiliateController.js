import Affiliate from "../../models/affiliateModel.js";
import Referral from "../../models/refferalModel.js";
import Commission from "../../models/commissionModel.js";
import User from "../../models/userModel.js";
import Order from "../../models/orderModel.js";
import Enrollment from "../../models/enrollmentModel.js";

// ======================================================
// ROLE ENUM
// ======================================================

const roleEnum = [
  "student",
  "teacher",
  "trainer",
  "institution",
  "admin"
];

// ======================================================
// GENERATE REFERRAL CODE
// ======================================================

const generateReferralCode = async (user) => {
  const baseName =
    user?.fullname ||
    user?.name ||
    user?.username ||
    "USER";

  const cleanName = baseName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 6);

  let code;
  let exists = true;

  while (exists) {
    const random = Math.floor(
      1000 + Math.random() * 9000
    );

    code = `${cleanName}${random}`;

    exists = await Affiliate.exists({
      referralCode: code
    });
  }

  return code;
};

// ======================================================
// CREATE AFFILIATE
// ======================================================

export const createAffiliate = async (req, res) => {
  try {
    const userId = req.user?._id || req.body?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const existingAffiliate =
      await Affiliate.findOne({
        user: userId
      });

    if (existingAffiliate) {
      return res.status(200).json({
        message: "Affiliate account already exists",
        affiliate: existingAffiliate
      });
    }

    const affiliateRole =
      user.role || "student";

    if (!roleEnum.includes(affiliateRole)) {
      return res.status(400).json({
        message:
          "Affiliate program is not available for your role"
      });
    }

    const referralCode =
      await generateReferralCode(user);

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    const referralLink =
      `${frontendUrl}/signup?ref=${referralCode}`;

    const affiliate =
      await Affiliate.create({
        user: userId,
        referralCode,
        referralLink,
        affiliateRole,
        status: "active"
      });

    return res.status(201).json({
      message:
        "Affiliate account created successfully",
      affiliate
    });

  } catch (error) {
    console.error(
      "createAffiliate error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to create affiliate account",
      error: error.message
    });
  }
};

// ======================================================
// GET MY AFFILIATE
// ======================================================

export const getMyAffiliate = async (
  req,
  res
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const affiliate =
      await Affiliate.findOne({
        user: userId
      }).populate(
        "user",
        "fullname email role"
      );

    if (!affiliate) {
      return res.status(404).json({
        message:
          "Affiliate account not found"
      });
    }

    return res.status(200).json({
      affiliate
    });

  } catch (error) {
    console.error(
      "getMyAffiliate error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch affiliate",
      error: error.message
    });
  }
};

// ======================================================
// TRACK REFERRAL CLICK
// ======================================================

export const trackReferralClick = async (
  req,
  res
) => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      return res.status(400).json({
        message:
          "Referral code is required"
      });
    }

    const affiliate =
      await Affiliate.findOne({
        referralCode:
          referralCode.toUpperCase(),
        status: "active"
      });

    if (!affiliate) {
      return res.status(404).json({
        message:
          "Invalid referral code"
      });
    }

    affiliate.clicks =
      Number(affiliate.clicks || 0) + 1;

    await affiliate.save();

    return res.status(200).json({
      valid: true,
      referralCode:
        affiliate.referralCode
    });

  } catch (error) {
    console.error(
      "trackReferralClick error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to track referral",
      error: error.message
    });
  }
};

// ======================================================
// APPLY REFERRAL TO NEW USER
// ======================================================

export const applyReferralToUser = async (
  userId,
  referralCode
) => {
  try {
    if (!userId || !referralCode) {
      return null;
    }

    const affiliate =
      await Affiliate.findOne({
        referralCode:
          referralCode.trim().toUpperCase(),
        status: "active"
      });

    if (!affiliate) {
      console.log(
        "Invalid affiliate referral code:",
        referralCode
      );

      return null;
    }

    // ==================================================
    // PREVENT SELF REFERRAL
    // ==================================================

    if (
      affiliate.user.toString() ===
      userId.toString()
    ) {
      console.log(
        "Self referral blocked"
      );

      return null;
    }

    // ==================================================
    // CHECK EXISTING REFERRAL
    // ==================================================

    const existingReferral =
      await Referral.findOne({
        referredUser: userId
      });

    if (existingReferral) {
      return existingReferral;
    }

    // ==================================================
    // CREATE REFERRAL
    // ==================================================

    const referral =
      await Referral.create({
        affiliate: affiliate._id,
        affiliateUser: affiliate.user,
        referredUser: userId,
        referralCode:
          affiliate.referralCode
      });

    // ==================================================
    // UPDATE REGISTRATION COUNT
    // ==================================================

    await Affiliate.findByIdAndUpdate(
      affiliate._id,
      {
        $inc: {
          registrations: 1
        }
      }
    );

    console.log(
      "Referral created:",
      referral._id
    );

    return referral;

  } catch (error) {
    console.error(
      "applyReferralToUser error:",
      error
    );

    return null;
  }
};

// ======================================================
// GET MY REFERRALS
// ======================================================

export const getMyReferrals = async (
  req,
  res
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required"
      });
    }

    // ==================================================
    // FIND AFFILIATE
    // ==================================================

    const affiliate =
      await Affiliate.findOne({
        user: userId
      });

    if (!affiliate) {
      return res.status(404).json({
        message:
          "Affiliate account not found"
      });
    }

    // ==================================================
    // FIND REFERRALS
    // ==================================================

    const referrals =
      await Referral.find({
        affiliate: affiliate._id
      })
        .populate(
          "referredUser",
          `
          fullname
          username
          email
          phoneNumber
          role
          profilePicture
          isActive
          createdAt
          courses
          `
        )
        .
        sort({
          createdAt: -1
        });

    // ==================================================
    // GET PAYMENT / ENROLLMENT STATUS
    // ==================================================

    const referredStudents =
      await Promise.all(
        referrals.map(async (referral) => {
          const student =
            referral.referredUser;

          if (!student) {
            return null;
          }

          // --------------------------------------------
          // FIND PAID ORDERS
          // --------------------------------------------

          const paidOrders =
            await Order.find({
              user: student._id,
              status: "paid"
            }).select(
              "_id amount course status createdAt paidAt"
            );

          // --------------------------------------------
          // FIND ENROLLMENTS
          // --------------------------------------------

          const enrollments =
            await Enrollment.find({
              user: student._id
            })
              .populate(
                "course",
                "name price"
              )
              .select(
                "course enrollmentType status enrolledAt"
              );

          // --------------------------------------------
          // CALCULATE STATUS
          // --------------------------------------------

          let conversionStatus =
            "registered";

          if (paidOrders.length > 0) {
            conversionStatus = "converted";
          }

          return {
            referralId:
              referral._id,

            referralCode:
              referral.referralCode,

            registeredAt:
              referral.registeredAt ||
              referral.createdAt,

            student: {
              _id: student._id,
              fullname:
                student.fullname,
              username:
                student.username,
              email:
                student.email,
              phoneNumber:
                student.phoneNumber,
              role:
                student.role,
              profilePicture:
                student.profilePicture,
              isActive:
                student.isActive,
              createdAt:
                student.createdAt
            },

            conversionStatus,

            paidOrders,

            enrollments
          };
        })
      );

    return res.status(200).json({
      total:
        referredStudents.filter(Boolean).length,

      referrals:
        referredStudents.filter(Boolean)
    });

  } catch (error) {
    console.error(
      "getMyReferrals error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch referrals",
      error: error.message
    });
  }
};

// ======================================================
// GET MY COMMISSIONS
// ======================================================

export const getMyCommissions = async (
  req,
  res
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required"
      });
    }

    const affiliate =
      await Affiliate.findOne({
        user: userId
      });

    if (!affiliate) {
      return res.status(404).json({
        message:
          "Affiliate account not found"
      });
    }

    const commissions =
      await Commission.find({
        affiliate: affiliate._id
      })
        .populate(
          "referredUser",
          "fullname email"
        )
        .populate(
          "course",
          "name price currency"
        )
        .populate(
          "order",
          "amount status createdAt paidAt"
        )
        .sort({
          createdAt: -1
        });

    return res.status(200).json({
      commissions
    });

  } catch (error) {
    console.error(
      "getMyCommissions error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch commissions",
      error: error.message
    });
  }
};

// ======================================================
// GET AFFILIATE DASHBOARD
// ======================================================

export const getAffiliateDashboard = async (
  req,
  res
) => {
  try {
    const {userId} = req.body;

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required"
      });
    }

    const affiliate =
      await Affiliate.findOne({
        user: userId
      });

    if (!affiliate) {
      return res.status(404).json({
        message:
          "Affiliate account not found"
      });
    }

    const recentCommissions =
      await Commission.find({
        affiliate: affiliate._id
      })
        .populate(
          "referredUser",
          "fullname email"
        )
        .populate(
          "course",
          "name price currency"
        )
        .sort({
          createdAt: -1
        })
        .limit(10);

    return res.status(200).json({
      affiliate: {
        referralCode:
          affiliate.referralCode,

        referralLink:
          affiliate.referralLink,

        clicks:
          affiliate.clicks,

        registrations:
          affiliate.registrations,

        conversions:
          affiliate.conversions,

        totalEarnings:
          affiliate.totalEarnings,

        pendingEarnings:
          affiliate.pendingEarnings,

        paidEarnings:
          affiliate.paidEarnings,

        status:
          affiliate.status
      },

      recentCommissions
    });

  } catch (error) {
    console.error(
      "getAffiliateDashboard error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load affiliate dashboard",
      error: error.message
    });
  }
};