import Course from "../models/courseModel.js";
import Enrollment from "../models/enrollmentModel.js";

export const enrollFreeCourse = async (
  req,
  res
) => {
  try {
    const userId = req.user._id;

    const { courseId } = req.body;

    // ==========================================
    // FIND COURSE
    // ==========================================

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    // ==========================================
    // CHECK COURSE TYPE
    // ==========================================

    if (course.courseType !== "free") {
      return res.status(400).json({
        message:
          "This course is not a free course"
      });
    }

    // ==========================================
    // CHECK EXISTING ENROLLMENT
    // ==========================================

    const existingEnrollment =
      await Enrollment.findOne({
        user: userId,
        course: courseId
      });

    if (existingEnrollment) {
      return res.status(400).json({
        message: "Already enrolled"
      });
    }

    // ==========================================
    // CREATE ENROLLMENT
    // ==========================================

    const enrollment =
      await Enrollment.create({
        user: userId,
        course: courseId,
        enrollmentType: "free",
        status: "active",
        enrolledAt: new Date()
      });

    return res.status(201).json({
      message:
        "Successfully enrolled in free course",

      enrollment
    });

  } catch (error) {
    console.error(
      "Free enrollment error:",
      error
    );

    return res.status(500).json({
      message: "Unable to enroll"
    });
  }
};