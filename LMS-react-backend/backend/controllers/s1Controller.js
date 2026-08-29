// controllers/s1Controller.js
import S1_LearningCulture from "../models/S1LearningCultureSchema.js";
import Student from "../models/studentModel.js";
import mongoose from "mongoose";

// ================================================================
// CREATE - Single S1 Assessment
// ================================================================

/**
 * @desc    Create a new S1 assessment
 * @route   POST /api/s1
 */
export const createS1 = async (req, res) => {
  try {
    const { student_id } = req.body;

    // Check if student exists
    const student = await Student.findOne({ student_id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check for duplicate assessment date
    const existing = await S1_LearningCulture.findOne({
      student_id,
      assessment_date: req.body.assessment_date || { $exists: true },
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An assessment already exists for this student on this date",
      });
    }

    const s1 = new S1_LearningCulture({
      ...req.body,
      created_by: req.user?._id,
    });

    await s1.save();

    res.status(201).json({
      success: true,
      message: "S1 assessment created successfully",
      data: s1,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating S1 assessment",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get All S1 Assessments
// ================================================================

/**
 * @desc    Get all S1 assessments with pagination and filters
 * @route   GET /api/s1
 */
export const getAllS1 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      student_id,
      submitted_by,
      level,
      from_date,
      to_date,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (submitted_by) filter.submitted_by = submitted_by;
    if (level) filter.level = level;

    // Date range filter
    if (from_date || to_date) {
      filter.assessment_date = {};
      if (from_date) filter.assessment_date.$gte = new Date(from_date);
      if (to_date) filter.assessment_date.$lte = new Date(to_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const assessments = await S1_LearningCulture.find(filter)
      .populate("student_id", "full_name class section roll_number")
      .populate("submitted_by_id", "username email")
      .populate("created_by", "username email")
      .populate("updated_by", "username email")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await S1_LearningCulture.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: assessments,
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
      message: "Error fetching S1 assessments",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Single S1 Assessment
// ================================================================

/**
 * @desc    Get a single S1 assessment by ID
 * @route   GET /api/s1/:id
 */
export const getS1ById = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S1_LearningCulture.findById(id)
      .populate("student_id", "full_name class section roll_number parent_info")
      .populate("submitted_by_id", "username email")
      .populate("created_by", "username email")
      .populate("updated_by", "username email");

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "S1 assessment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching S1 assessment",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Latest S1 for a Student
// ================================================================

/**
 * @desc    Get the latest S1 assessment for a student
 * @route   GET /api/s1/student/:studentId/latest
 */
export const getLatestS1ByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S1_LearningCulture.getLatest(studentId)
      .populate("student_id", "full_name class section roll_number")
      .populate("submitted_by_id", "username email");

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "No S1 assessment found for this student",
      });
    }

    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching latest S1 assessment",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Historical S1 for a Student
// ================================================================

/**
 * @desc    Get historical S1 assessments for a student
 * @route   GET /api/s1/student/:studentId/history
 */
export const getS1History = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10 } = req.query;

    const assessments = await S1_LearningCulture.getHistorical(studentId, parseInt(limit))
      .populate("student_id", "full_name class section")
      .populate("submitted_by_id", "username email");

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching S1 history",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get S1 by Submitted By
// ================================================================

/**
 * @desc    Get S1 assessments by submitted_by type
 * @route   GET /api/s1/submitted-by/:type
 */
export const getS1BySubmittedBy = async (req, res) => {
  try {
    const { type } = req.params;
    const { studentId } = req.query;

    const filter = { submitted_by: type };
    if (studentId) filter.student_id = studentId;

    const assessments = await S1_LearningCulture.find(filter)
      .populate("student_id", "full_name class section")
      .populate("submitted_by_id", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching S1 by submitted_by",
      error: error.message,
    });
  }
};

// ================================================================
// READ - Get Attack Indicators
// ================================================================

/**
 * @desc    Get attack indicators from S1 for a student
 * @route   GET /api/s1/student/:studentId/attacks
 */
export const getAttackIndicators = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S1_LearningCulture.getLatest(studentId);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "No S1 assessment found for this student",
      });
    }

    const indicators = assessment.getAttackIndicators();

    res.status(200).json({
      success: true,
      data: {
        student_id: studentId,
        overall_score: assessment.overall_score,
        level: assessment.level,
        indicators,
        summary: {
          total_indicators: indicators.length,
          high_severity: indicators.filter((i) => i.severity >= 7).length,
          medium_severity: indicators.filter((i) => i.severity >= 4 && i.severity < 7).length,
          low_severity: indicators.filter((i) => i.severity < 4).length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attack indicators",
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE - Update S1 Assessment
// ================================================================

/**
 * @desc    Update an S1 assessment
 * @route   PUT /api/s1/:id
 */
export const updateS1 = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent updating student_id
    delete req.body.student_id;

    const assessment = await S1_LearningCulture.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updated_by: req.user?._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "S1 assessment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "S1 assessment updated successfully",
      data: assessment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating S1 assessment",
      error: error.message,
    });
  }
};

// ================================================================
// DELETE - Delete S1 Assessment
// ================================================================

/**
 * @desc    Delete an S1 assessment
 * @route   DELETE /api/s1/:id
 */
export const deleteS1 = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S1_LearningCulture.findByIdAndDelete(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "S1 assessment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "S1 assessment deleted successfully",
      data: {
        id: assessment._id,
        student_id: assessment.student_id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting S1 assessment",
      error: error.message,
    });
  }
};

// ================================================================
// BULK OPERATIONS
// ================================================================

// ----- BULK UPLOAD -----

/**
 * @desc    Bulk upload S1 assessments
 * @route   POST /api/s1/bulk-upload
 */
export const bulkUploadS1 = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of S1 assessment records",
      });
    }

    const results = await S1_LearningCulture.bulkUpsert(records, options);

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
 * @desc    Bulk delete S1 assessments
 * @route   DELETE /api/s1/bulk-delete
 * @access  Admin
 */
export const bulkDeleteS1 = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of assessment IDs",
      });
    }

    const results = await S1_LearningCulture.bulkDelete(ids);

    res.status(200).json({
      success: true,
      message: "S1 assessments deleted successfully",
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

// ----- BULK DELETE BY STUDENT -----

/**
 * @desc    Bulk delete S1 assessments by student
 * @route   DELETE /api/s1/bulk-delete-student
 */
export const bulkDeleteS1ByStudent = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    const results = await S1_LearningCulture.bulkDeleteByStudent(studentIds);

    res.status(200).json({
      success: true,
      message: "S1 assessments deleted successfully",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk delete by student",
      error: error.message,
    });
  }
};

// ================================================================
// STATISTICS
// ================================================================

/**
 * @desc    Get S1 statistics
 * @route   GET /api/s1/stats
 */
export const getS1Stats = async (req, res) => {
  try {
    const stats = await S1_LearningCulture.getStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching S1 statistics",
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  // CRUD
  createS1,
  getAllS1,
  getS1ById,
  getLatestS1ByStudent,
  getS1History,
  getS1BySubmittedBy,
  getAttackIndicators,
  updateS1,
  deleteS1,

  // Bulk Operations
  bulkUploadS1,
  bulkDeleteS1,
  bulkDeleteS1ByStudent,

  // Statistics
  getS1Stats,
};