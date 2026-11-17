import express from "express";

import {
  createAffiliate,
  getMyAffiliate,
  trackReferralClick,
  getMyReferrals,
  getMyCommissions,
  getAffiliateDashboard,
  applyReferralToUser
} from "../../controllers/affilates/affiliateController.js";
import authenticate from "../../middleware/authenticate.js";

const router = express.Router();


// ======================================================
// PUBLIC
// ======================================================

router.get(
  "/track/:referralCode",
  trackReferralClick
);


// ======================================================
// AUTHENTICATED
// ======================================================

router.post(
  "/create",
  createAffiliate
);

router.get(
  "/me",
  getMyAffiliate
);

router.post(
  "/dashboard",
  getAffiliateDashboard
);

router.get(
  "/referrals",
  authenticate,
  getMyReferrals
);

router.get(
  "/commissions",
  getMyCommissions
);


export default router;