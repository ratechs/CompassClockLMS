// routes/studentRoutes.js
import express from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByUserId,
  getStudentsByClass,
  getStudentDashboard,
  getStudentFullProfile,
  updateStudent,
  updateAttendance,
  updateStudentStatus,
  deleteStudent,
  bulkUploadStudents,
  bulkDeleteStudents,
  bulkUpdateStatus,
  bulkTransferClass,
  bulkUpdateAttendance,
  getStudentStats,
  getStudentsByInstitution
} from "../controllers/studentController.js";

const router = express.Router();

// ================================================================
// STATS
// ================================================================

router.get("/stats", getStudentStats);

// ================================================================
// BULK OPERATIONS
// ================================================================

router.post("/bulk-upload", bulkUploadStudents);
router.delete("/bulk-delete", bulkDeleteStudents);
router.patch("/bulk-status", bulkUpdateStatus);
router.patch("/bulk-transfer", bulkTransferClass);
router.patch("/bulk-attendance", bulkUpdateAttendance);

// ================================================================
// STUDENT ROUTES
// ================================================================

router
  .route("/")
  .get(getAllStudents)
  .post(createStudent);

router
  .route("/:id")
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

router.get("/user/:userId", getStudentByUserId);

router.get("/class/:className", getStudentsByClass);

router.get("/:id/dashboard", getStudentDashboard);

router.get("/:id/profile", getStudentFullProfile);

router.get("/institution/:id/", getStudentsByInstitution);

router.patch("/:id/attendance", updateAttendance);

router.patch("/:id/status", updateStudentStatus);

export default router;