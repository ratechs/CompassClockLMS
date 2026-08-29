// controllers/s5Controller.js
import s5AttackAnalysis from "../models/s5_AttackAnalysis.js";
import Student from "../models/studentModel.js";
import S1LearningCulture from "../models/S1_LearningCulture.js";
import S2AcademicPerformance from "../models/S2_AcademicPerformance.js";
import S3RIASEC from "../models/S3_RIASEC.js";
import SWOTConsolidated from "../models/s4_SWOT.js";
import mongoose from "mongoose";

// ================================================================
// CONSTANTS
// ================================================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const MESSAGES = {
  CREATED: "S5 Attack Analysis created successfully",
  UPDATED: "S5 Attack Analysis updated successfully",
  DELETED: "S5 Attack Analysis deleted successfully",
  NOT_FOUND: "S5 Attack Analysis not found",
  STUDENT_NOT_FOUND: "Student not found",
  CALCULATED: "S5 Attack Analysis calculated successfully",
  BULK_SUCCESS: "Bulk upload completed",
  BULK_DELETE_SUCCESS: "S5 Attack Analysis records deleted successfully",
};

const sendResponse = (res, status, success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// ================================================================
// CREATE - Manual
// ================================================================

export const createS5 = async (req, res) => {
  try {
    const { student_id } = req.body;

    const student = await Student.findOne({ student_id });
    if (!student) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.STUDENT_NOT_FOUND);
    }

    const s5 = new S5AttackAnalysis({
      ...req.body,
      calculated_by_id: req.user?._id,
    });

    await s5.save();

    return sendResponse(res, HTTP_STATUS.CREATED, true, MESSAGES.CREATED, s5);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error creating S5 Attack Analysis", {
      error: error.message,
    });
  }
};

// ================================================================
// CALCULATE - Auto from S1-S4
// ================================================================

export const calculateS5 = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all data sources
    const [s1, s2, s3, s4] = await Promise.all([
      S1LearningCulture.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
      S2AcademicPerformance.find({ student_id: studentId, is_latest: true }),
      S3RIASEC.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
      SWOTConsolidated.findOne({ student_id: studentId, is_latest: true }),
    ]);

    // Check if we have enough data
    if (!s1) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "S1 Learning Culture data is required");
    }

    // Calculate attacks
    const attackData = S5AttackAnalysis.calculateAttacks({
      s1,
      s2,
      s3,
      s4,
    });

    // Check if existing record exists
    const existing = await S5AttackAnalysis.findOne({
      student_id: studentId,
      is_latest: true,
    });

    let result;
    if (existing) {
      result = await S5AttackAnalysis.findByIdAndUpdate(
        existing._id,
        {
          ...attackData,
          input_sources: {
            s1_id: s1?._id,
            s2_ids: s2?.map((s) => s._id) || [],
            s3_id: s3?._id,
            s4_id: s4?._id,
          },
          calculated_by_id: req.user?._id,
          version: existing.version + 1,
        },
        { new: true }
      );
    } else {
      const s5 = new S5AttackAnalysis({
        student_id: studentId,
        ...attackData,
        input_sources: {
          s1_id: s1?._id,
          s2_ids: s2?.map((s) => s._id) || [],
          s3_id: s3?._id,
          s4_id: s4?._id,
        },
        calculated_by_id: req.user?._id,
      });
      result = await s5.save();
    }

    return sendResponse(res, HTTP_STATUS.CREATED, true, MESSAGES.CALCULATED, result);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error calculating S5 Attack Analysis", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - All
// ================================================================

export const getAllS5 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      student_id,
      overall_risk_level,
      highest_attack,
      from_date,
      to_date,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (overall_risk_level) filter.overall_risk_level = overall_risk_level;
    if (highest_attack) filter.highest_attack = highest_attack;

    if (from_date || to_date) {
      filter.assessment_date = {};
      if (from_date) filter.assessment_date.$gte = new Date(from_date);
      if (to_date) filter.assessment_date.$lte = new Date(to_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [assessments, total] = await Promise.all([
      S5AttackAnalysis.find(filter)
        .populate("student_id", "full_name class section roll_number")
        .populate("calculated_by_id", "username email")
        .populate("input_sources.s1_id", "level overall_score")
        .populate("input_sources.s3_id", "dominant_type")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      S5AttackAnalysis.countDocuments(filter),
    ]);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      assessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S5 assessments", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Single
// ================================================================

export const getS5ById = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S5AttackAnalysis.findById(id)
      .populate("student_id", "full_name class section roll_number parent_info")
      .populate("calculated_by_id", "username email")
      .populate("input_sources.s1_id", "level overall_score")
      .populate("input_sources.s3_id", "dominant_type");

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S5 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Latest by Student
// ================================================================

export const getLatestS5ByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S5AttackAnalysis.getLatest(studentId)
      .populate("student_id", "full_name class section roll_number")
      .populate("calculated_by_id", "username email");

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S5 attack analysis found for this student");
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching latest S5 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - By Risk Level
// ================================================================

export const getS5ByRiskLevel = async (req, res) => {
  try {
    const { level } = req.params;

    const assessments = await S5AttackAnalysis.getByRiskLevel(level);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S5 by risk level", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Priority Actions
// ================================================================

export const getPriorityActions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S5AttackAnalysis.getLatest(studentId);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S5 attack analysis found for this student");
    }

    const priorityActions = assessment.getPriorityActions();

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", priorityActions);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching priority actions", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Recommendations Summary
// ================================================================

export const getRecommendationsSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S5AttackAnalysis.getLatest(studentId);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S5 attack analysis found for this student");
    }

    const recommendations = assessment.getRecommendationsSummary();

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", recommendations);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching recommendations summary", {
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE
// ================================================================

export const updateS5 = async (req, res) => {
  try {
    const { id } = req.params;

    delete req.body.student_id;

    const assessment = await S5AttackAnalysis.findByIdAndUpdate(
      id,
      {
        ...req.body,
        calculated_by_id: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.UPDATED, assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error updating S5 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// DELETE
// ================================================================

export const deleteS5 = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S5AttackAnalysis.findByIdAndDelete(id);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.DELETED, {
      id: assessment._id,
      student_id: assessment.student_id,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error deleting S5 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// BULK UPLOAD
// ================================================================

export const bulkUploadS5 = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of S5 assessment records");
    }

    const results = await S5AttackAnalysis.bulkUpsert(records, options);

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.BULK_SUCCESS, {
      results,
      summary: {
        total: records.length,
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error in bulk upload", {
      error: error.message,
    });
  }
};

// ================================================================
// BULK DELETE
// ================================================================

export const bulkDeleteS5 = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of assessment IDs");
    }

    const results = await S5AttackAnalysis.bulkDelete(ids);

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.BULK_DELETE_SUCCESS, results);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error in bulk delete", {
      error: error.message,
    });
  }
};

// ================================================================
// BULK DELETE BY STUDENT
// ================================================================

export const bulkDeleteS5ByStudent = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of student IDs");
    }

    const results = await S5AttackAnalysis.bulkDeleteByStudent(studentIds);

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.BULK_DELETE_SUCCESS, results);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error in bulk delete by student", {
      error: error.message,
    });
  }
};

// ================================================================
// STATISTICS
// ================================================================

export const getS5Stats = async (req, res) => {
  try {
    const stats = await S5AttackAnalysis.getStatistics();

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", stats);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S5 statistics", {
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  createS5,
  calculateS5,
  getAllS5,
  getS5ById,
  getLatestS5ByStudent,
  getS5ByRiskLevel,
  getPriorityActions,
  getRecommendationsSummary,
  updateS5,
  deleteS5,
  bulkUploadS5,
  bulkDeleteS5,
  bulkDeleteS5ByStudent,
  getS5Stats,
};