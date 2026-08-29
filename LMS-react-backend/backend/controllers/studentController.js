// controllers/studentController.js
import Student from "../models/studentModel.js";
import mongoose from "mongoose";

// ================================================================
// CREATE - Single Student
// ================================================================

/**
 * @desc    Create a new student
 * @route   POST /api/students
 */
export const createStudent = async (req, res) => {
  try {
    const { student_id, user_id } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ student_id });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with ID ${student_id} already exists`,
      });
    }

    // Check if user is already linked to a student
    if (user_id) {
      const userLinked = await Student.findOne({ user_id });
      if (userLinked) {
        return res.status(400).json({
          success: false,
          message: `User ${user_id} is already linked to another student`,
        });
      }
    }

    const student = new Student(req.body);
    await student.save();

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating student",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get All Students
// ================================================================

/**
 * @desc    Get all students with pagination and filters
 * @route   GET /api/students
 * @access  Admin/Teacher
 */
export const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      class: className,
      section,
      status,
      is_active,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = {};
    if (className) filter.class = className;
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (is_active !== undefined) filter.is_active = is_active === "true";

    // Search filter
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { student_id: { $regex: search, $options: "i" } },
        { "parent_info.father.name": { $regex: search, $options: "i" } },
        { "parent_info.father.contact": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.find(filter)
      .populate("user_id", "username email phoneNumber role")
      .populate("school_info.name", "name address contact")
      .populate("created_by", "username email")
      .populate("updated_by", "username email")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Single Student
// ================================================================

/**
 * @desc    Get a single student by ID
 * @route   GET /api/students/:id
 * @access  Admin/Teacher/Parent
 */
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    let student;
    // Check if ID is student_id or MongoDB _id
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findById(id)
        .populate("user_id", "username email phoneNumber role")
        .populate("school_info.name", "name address contact")
        .populate("created_by", "username email")
        .populate("updated_by", "username email");
    } else {
      student = await Student.findOne({ student_id: id })
        .populate("user_id", "username email phoneNumber role")
        .populate("school_info.name", "name address contact")
        .populate("created_by", "username email")
        .populate("updated_by", "username email");
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Student by User ID
// ================================================================

/**
 * @desc    Get student by user_id
 * @route   GET /api/students/user/:userId
 */
export const getStudentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await Student.findOne({ user_id: userId })
      .populate("user_id", "username email phoneNumber role")
      .populate("school_info.name", "name address contact")
      .populate("created_by", "username email")
      .populate("updated_by", "username email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Students by Class
// ================================================================

/**
 * @desc    Get all students in a class
 * @route   GET /api/students/class/:className
 */
export const getStudentsByInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = id;
    const { section, class: className, status } = req.query;

    // Validate institution ID
    if (!institutionId) {
      return res.status(400).json({
        success: false,
        message: "Institution ID is required",
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid institution ID format",
      });
    }

    // Build filter
    const filter = {
      "school_info.name": institutionId, // Reference to Institution model
      is_active: true,
    };

    // Optional filters
    if (className) filter.class = className;
    if (section) filter.section = section;
    if (status) filter.status = status;

    // Fetch students
    const students = await Student.find(filter)
      .populate("user_id", "username email phoneNumber role")
      .populate("school_info.name", "name address contact") // Populate institution details
      .populate("created_by", "username email")
      .sort({ full_name: 1, roll_number: 1 });

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found for this institution",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students by institution:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching students by institution",
      error: error.message,
    });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const { section } = req.query;

    const students = await Student.findByClass(className, section);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching students by class",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Student Dashboard Summary
// ================================================================

/**
 * @desc    Get student dashboard summary with S1-S5 data
 * @route   GET /api/students/:id/dashboard
 * @access  Student/Parent/Teacher
 */
export const getStudentDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    let student;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findById(id);
    } else {
      student = await Student.findOne({ student_id: id });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const dashboard = await student.getDashboardSummary();

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Student Full Profile
// ================================================================

/**
 * @desc    Get student full profile with all assessments
 * @route   GET /api/students/:id/profile
 */
export const getStudentFullProfile = async (req, res) => {
  try {
    const { id } = req.params;

    let student;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findById(id);
    } else {
      student = await Student.findOne({ student_id: id });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const profile = await student.getFullProfile();

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching full profile",
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE - Update Student
// ================================================================

/**
 * @desc    Update a student
 * @route   PUT /api/students/:id
 */
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating student_id
    delete updateData.student_id;

    let student;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      student = await Student.findOneAndUpdate(
        { student_id: id },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating student",
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE - Update Attendance
// ================================================================

/**
 * @desc    Update student attendance percentage
 * @route   PATCH /api/students/:id/attendance
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance_percentage } = req.body;

    if (attendance_percentage < 0 || attendance_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: "Attendance percentage must be between 0 and 100",
      });
    }

    let student;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findById(id);
    } else {
      student = await Student.findOne({ student_id: id });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await student.updateAttendance(attendance_percentage);

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: {
        student_id: student.student_id,
        attendance_percentage: student.attendance.attendance_percentage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating attendance",
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE - Update Status
// ================================================================

/**
 * @desc    Update student status
 * @route   PATCH /api/students/:id/status
 */
export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_reason } = req.body;

    const validStatuses = ["active", "inactive", "transferred", "graduated", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updateData = { status };
    if (status_reason) updateData.status_reason = status_reason;

    let student;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      student = await Student.findOneAndUpdate(
        { student_id: id },
        updateData,
        { new: true }
      );
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student status updated successfully",
      data: {
        student_id: student.student_id,
        status: student.status,
        status_reason: student.status_reason,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating student status",
      error: error.message,
    });
  }
};

// ================================================================
// DELETE - Delete Student
// ================================================================

/**
 * @desc    Delete a student
 * @route   DELETE /api/students/:id
 */
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    let student;
    if (mongoose.Types.ObjectId.isValid(id)) {
      if (permanent === "true") {
        student = await Student.findByIdAndDelete(id);
      } else {
        student = await Student.findByIdAndUpdate(
          id,
          { is_active: false, status: "inactive" },
          { new: true }
        );
      }
    } else {
      if (permanent === "true") {
        student = await Student.findOneAndDelete({ student_id: id });
      } else {
        student = await Student.findOneAndUpdate(
          { student_id: id },
          { is_active: false, status: "inactive" },
          { new: true }
        );
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: permanent === "true"
        ? "Student permanently deleted"
        : "Student deactivated successfully",
      data: {
        student_id: student.student_id,
        is_active: student.is_active,
        status: student.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting student",
      error: error.message,
    });
  }
};

// ================================================================
// BULK OPERATIONS
// ================================================================

// ----- BULK UPLOAD -----

/**
 * @desc    Bulk upload students
 * @route   POST /api/students/bulk-upload
 */
export const bulkUploadStudents = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student records",
      });
    }

    const results = await Student.bulkUpsert(records, options);

    res.status(200).json({
      success: true,
      data: results,
      summary: {
        total: records.length,
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk upload",
      error: error.message,
    });
  }
};

// ----- BULK DELETE -----

/**
 * @desc    Bulk delete students
 * @route   DELETE /api/students/bulk-delete
 */
export const bulkDeleteStudents = async (req, res) => {
  try {
    const { studentIds, permanent = false } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    let results;
    if (permanent) {
      results = await Student.bulkDelete(studentIds);
    } else {
      // Soft delete - deactivate
      const updates = studentIds.map((student_id) => ({
        student_id,
        status: "inactive",
      }));
      results = await Student.bulkUpdateStatus(
        studentIds,
        "inactive"
      );
    }

    res.status(200).json({
      success: true,
      message: permanent ? "Students permanently deleted" : "Students deactivated",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk delete",
      error: error.message,
    });
  }
};

// ----- BULK STATUS UPDATE -----

/**
 * @desc    Bulk update student status
 * @route   PATCH /api/students/bulk-status
 */
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { studentIds, status } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    const validStatuses = ["active", "inactive", "transferred", "graduated", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const results = await Student.bulkUpdateStatus(studentIds, status);

    res.status(200).json({
      success: true,
      message: "Student statuses updated successfully",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk status update",
      error: error.message,
    });
  }
};

// ----- BULK CLASS TRANSFER -----

/**
 * @desc    Bulk transfer students to a new class
 * @route   PATCH /api/students/bulk-transfer
 */
export const bulkTransferClass = async (req, res) => {
  try {
    const { studentIds, newClass, newSection = "" } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    if (!newClass) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new class name",
      });
    }

    const results = await Student.bulkTransferClass(studentIds, newClass, newSection);

    res.status(200).json({
      success: true,
      message: "Students transferred successfully",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk class transfer",
      error: error.message,
    });
  }
};

// ----- BULK UPDATE ATTENDANCE -----

/**
 * @desc    Bulk update student attendance
 * @route   PATCH /api/students/bulk-attendance
 */
export const bulkUpdateAttendance = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of attendance updates",
      });
    }

    // Validate each update
    for (const update of updates) {
      if (!update.student_id) {
        return res.status(400).json({
          success: false,
          message: "Each update must have a student_id",
        });
      }
      if (
        update.attendance_percentage === undefined ||
        update.attendance_percentage < 0 ||
        update.attendance_percentage > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "attendance_percentage must be between 0 and 100 for all updates",
        });
      }
    }

    const results = await Student.bulkUpdateAttendance(updates);

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk attendance update",
      error: error.message,
    });
  }
};


// ================================================================
// STATISTICS
// ================================================================

/**
 * @desc    Get student statistics
 * @route   GET /api/students/stats
 */
export const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ is_active: true });
    const totalInactive = await Student.countDocuments({ is_active: false });

    const classStats = await Student.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: { class: "$class", section: "$section" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          class: "$_id.class",
          section: "$_id.section",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { class: 1, section: 1 } },
    ]);

    const statusStats = await Student.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const literacyStats = await Student.aggregate([
      {
        $group: {
          _id: "$parent_info.father.literacy_status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          literacy: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const attendanceStats = await Student.aggregate([
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: "$attendance.attendance_percentage" },
          maxAttendance: { $max: "$attendance.attendance_percentage" },
          minAttendance: { $min: "$attendance.attendance_percentage" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: {
          active: totalStudents,
          inactive: totalInactive,
          total: totalStudents + totalInactive,
        },
        classDistribution: classStats,
        statusDistribution: statusStats,
        literacyDistribution: literacyStats,
        attendanceStats: attendanceStats[0] || {
          avgAttendance: 0,
          maxAttendance: 0,
          minAttendance: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT ROUTES
// ================================================================

export default {
  // CRUD
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

  // Bulk Operations
  bulkUploadStudents,
  bulkDeleteStudents,
  bulkUpdateStatus,
  bulkTransferClass,
  bulkUpdateAttendance,

  // Statistics
  getStudentStats,
};