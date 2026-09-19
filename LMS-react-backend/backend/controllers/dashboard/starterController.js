import mongoose from "mongoose";
import Course from "../../models/courseModel.js";

class TeacherStarterController {
  async teacherStarter(req, res) {
    try {
      const { userID } = req.params;

      // ---------------------------------------------
      // Validate user ID
      // ---------------------------------------------
      if (!userID) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userID)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // ---------------------------------------------
      // Get courses created by this teacher
      // ---------------------------------------------
      const courses = await Course.find({
        created_by: userID,
      }).lean();

      // ---------------------------------------------
      // Dashboard variables
      // ---------------------------------------------
      const courseCount = courses.length;

      let testCount = 0;

      let totalCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let pendingCount = 0;

      // ---------------------------------------------
      // Store unique student IDs
      // ---------------------------------------------
      const studentIds = new Set();

      // ---------------------------------------------
      // Loop through teacher courses
      // ---------------------------------------------
      courses.forEach((course) => {
        const joinRequests = Array.isArray(course.joinRequests)
          ? course.joinRequests
          : [];

        // -------------------------------------------
        // Count requests
        // -------------------------------------------
        totalCount += joinRequests.length;

        // -------------------------------------------
        // Count students
        // -------------------------------------------
        joinRequests.forEach((request) => {
          if (request.user) {
            const studentId =
              request.user?._id ||
              request.user?.id ||
              request.user;

            if (studentId) {
              studentIds.add(studentId.toString());
            }
          }

          // -----------------------------------------
          // Request status
          // -----------------------------------------
          const status = request.status?.toLowerCase();

          if (status === "approved") {
            approvedCount++;
          } else if (status === "rejected") {
            rejectedCount++;
          } else if (status === "pending") {
            pendingCount++;
          }
        });

        // -------------------------------------------
        // Tests
        // -------------------------------------------
        // Only calculate this if your Course model
        // contains a "tests" array.
        if (Array.isArray(course.tests)) {
          testCount += course.tests.length;
        }
      });

      // ---------------------------------------------
      // Unique students
      // ---------------------------------------------
      const studentCount = studentIds.size;

      // ---------------------------------------------
      // Final dashboard data
      // ---------------------------------------------
      const data = {
        courseCount,
        testCount,
        studentCount,

        requests: {
          total: totalCount,
          approved: approvedCount,
          rejected: rejectedCount,
          pending: pendingCount,
        },
      };

      // ---------------------------------------------
      // Response
      // ---------------------------------------------
      return res.status(200).json({
        success: true,
        message: "Teacher dashboard fetched successfully",
        data,
      });
    } catch (error) {
      console.error("Teacher dashboard error:", error);

      return res.status(500).json({
        success: false,
        message: "Error fetching teacher dashboard",
        error: error.message,
      });
    }
  }
}

export default new TeacherStarterController();