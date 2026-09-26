import express from "express";

import {
  createCourseOrder
} from "../../controllers/payment/paymentController.js";

import {
  verifyCoursePayment
} from "../../controllers/payment/paymentVerficationController.js";


const router = express.Router();

router.post(
  "/course/create-order",
  createCourseOrder
);

router.post(
  "/course/verify",
  verifyCoursePayment
);

export default router;