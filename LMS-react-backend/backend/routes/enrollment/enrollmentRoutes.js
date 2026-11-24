import express from "express";

import {
  enrollFreeCourse,
  listEnrolledCourseByUser
} from "../../controllers/enrollmentController.js";

const router = express.Router();

router.post(
  "/free",
  enrollFreeCourse
);

router.get("/:userId", listEnrolledCourseByUser)

export default router;