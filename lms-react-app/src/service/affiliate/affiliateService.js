import axios from "axios";

// const API_URL =
//   process.env.REACT_APP_API_URL ||
//   "localhost:5000";

const API_URL = "http://localhost:5000";

const getAuthConfig = () => {
  return {
    withCredentials: true
  };
};


// ==========================================
// CREATE AFFILIATE
// ==========================================

export const createAffiliateService =
  async (userId) => {

    const response =
      await axios.post(
        `/api/affiliates/create`,
        {userId: userId},
        getAuthConfig()
      );

    return response.data;
  };


// ==========================================
// GET DASHBOARD
// ==========================================

export const affiliateDashboardService =
  async (userID) => {

    const response =
      await axios.post(
        `/api/affiliates/dashboard`,
        {userId: userID},
        getAuthConfig()
      );

    return response.data;
  };


// ==========================================
// GET REFERRALS
// ==========================================

export const affiliateReferralsService =
  async () => {

    const response =
      await axios.get(
        `/api/affiliates/referrals`,
        getAuthConfig()
      );

    return response.data;
  };


// ==========================================
// GET COMMISSIONS
// ==========================================

export const affiliateCommissionsService =
  async () => {

    const response =
      await axios.get(
        `/api/affiliates/commissions`,
        getAuthConfig()
      );

    return response.data;
  };