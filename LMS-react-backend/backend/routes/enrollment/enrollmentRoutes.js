import express from "express";

import {
  enrollFreeCourse
} from "../../controllers/enrollmentController.js";

const router = express.Router();

router.post(
  "/free",
  enrollFreeCourse
);

export default router;