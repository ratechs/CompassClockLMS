// controllers/s2Controller.js
import S2AcademicPerformance from "../models/S2_AcademicPerformance.js";
import Student from "../models/studentModel.js";
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
  CREATED: "S2 assessment created successfully",
  UPDATED: "S2 assessment updated successfully",
  DELETED: "S2 assessment deleted successfully",
  NOT_FOUND: "S2 assessment not found",
  STUDENT_NOT_FOUND: "Student not found",
  DUPLICATE: "An assessment already exists for this student, subject, and exam type",
  BULK_SUCCESS: "Bulk upload completed",
  BULK_DELETE_SUCCESS: "S2 assessments deleted successfully",
};

const sendResponse = (res, status, success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// ================================================================
// CREATE
// ================================================================

export const createS2 = async (req, res) => {
  try {
    const { student_id, subject, exam_type, exam_date } = req.body;

    const student = await Student.findOne({ student_id });
    if (!student) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.STUDENT_NOT_FOUND);
    }

    const existing = await S2AcademicPerformance.findOne({
      student_id,
      subject,
      exam_type,
      exam_date: exam_date || { $exists: true },
    }).sort({ createdAt: -1 });

    if (existing) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, MESSAGES.DUPLICATE);
    }

    const s2 = new S2AcademicPerformance({
      ...req.body,
      uploaded_by: req.user?._id,
      uploaded_by_name: req.user?.username,
    });

    await s2.save();

    return sendResponse(res, HTTP_STATUS.CREATED, true, MESSAGES.CREATED, s2);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error creating S2 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - All
// ================================================================

export const getAllS2 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      student_id,
      subject,
      exam_type,
      health_status,
      from_date,
      to_date,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (subject) filter.subject = subject;
    if (exam_type) filter.exam_type = exam_type;
    if (health_status) filter.health_status = health_status;

    if (from_date || to_date) {
      filter.exam_date = {};
      if (from_date) filter.exam_date.$gte = new Date(from_date);
      if (to_date) filter.exam_date.$lte = new Date(to_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [assessments, total] = await Promise.all([
      S2AcademicPerformance.find(filter)
        .populate("student_id", "full_name class section roll_number")
        .populate("uploaded_by", "username email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      S2AcademicPerformance.countDocuments(filter),
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
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S2 assessments", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Single
// ================================================================

export const getS2ById = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S2AcademicPerformance.findById(id)
      .populate("student_id", "full_name class section roll_number parent_info")
      .populate("uploaded_by", "username email");

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S2 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Latest by Student
// ================================================================

export const getLatestS2ByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;

    const assessments = await S2AcademicPerformance.getLatest(studentId, subject)
      .populate("student_id", "full_name class section roll_number")
      .populate("uploaded_by", "username email");

    if (!assessments || assessments.length === 0) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S2 assessment found for this student");
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", assessments);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching latest S2 assessments", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - History
// ================================================================

export const getS2History = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject, limit = 10 } = req.query;

    const assessments = await S2AcademicPerformance.getHistorical(
      studentId,
      subject,
      parseInt(limit)
    )
      .populate("student_id", "full_name class section")
      .populate("uploaded_by", "username email");

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S2 history", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Trends
// ================================================================

export const getS2Trends = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;

    if (!subject) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "subject is required");
    }

    const trends = await S2AcademicPerformance.getTrends(studentId, subject);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", trends);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S2 trends", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Class Performance
// ================================================================

export const getClassPerformance = async (req, res) => {
  try {
    const { className } = req.params;
    const { subject, exam_type } = req.query;

    if (!subject || !exam_type) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "subject and exam_type are required");
    }

    const performance = await S2AcademicPerformance.getClassPerformance(
      subject,
      exam_type,
      className
    );

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", performance[0] || null);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching class performance", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - S5 Indicators
// ================================================================

export const getS5Indicators = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessments = await S2AcademicPerformance.getLatest(studentId);

    if (!assessments || assessments.length === 0) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S2 assessment found for this student");
    }

    const results = assessments.map((assessment) => ({
      subject: assessment.subject,
      exam_type: assessment.exam_type,
      academic_health: assessment.academic_health,
      health_status: assessment.health_status,
      indicators: assessment.getS5Indicators(),
    }));

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", results);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S5 indicators", {
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE
// ================================================================

export const updateS2 = async (req, res) => {
  try {
    const { id } = req.params;

    delete req.body.student_id;
    delete req.body.subject;
    delete req.body.exam_type;

    const assessment = await S2AcademicPerformance.findByIdAndUpdate(
      id,
      {
        ...req.body,
        uploaded_by: req.user?._id,
        uploaded_by_name: req.user?.username,
      },
      { new: true, runValidators: true }
    );

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.UPDATED, assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error updating S2 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// DELETE
// ================================================================

export const deleteS2 = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S2AcademicPerformance.findByIdAndDelete(id);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.DELETED, {
      id: assessment._id,
      student_id: assessment.student_id,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error deleting S2 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// BULK UPLOAD
// ================================================================

export const bulkUploadS2 = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of S2 assessment records");
    }

    const results = await S2AcademicPerformance.bulkUpsert(records, options);

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

export const bulkDeleteS2 = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of assessment IDs");
    }

    const results = await S2AcademicPerformance.bulkDelete(ids);

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

export const bulkDeleteS2ByStudent = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of student IDs");
    }

    const results = await S2AcademicPerformance.bulkDeleteByStudent(studentIds);

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

export const getS2Stats = async (req, res) => {
  try {
    const stats = await S2AcademicPerformance.aggregate([
      {
        $group: {
          _id: null,
          avg_knowledge: { $avg: "$scores.knowledge" },
          avg_application: { $avg: "$scores.application" },
          avg_problem_solving: { $avg: "$scores.problem_solving" },
          avg_excellence: { $avg: "$scores.excellence" },
          avg_health: { $avg: "$academic_health" },
          total_records: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averages: {
            knowledge: { $round: ["$avg_knowledge", 1] },
            application: { $round: ["$avg_application", 1] },
            problem_solving: { $round: ["$avg_problem_solving", 1] },
            excellence: { $round: ["$avg_excellence", 1] },
            academic_health: { $round: ["$avg_health", 1] },
          },
          total_records: 1,
        },
      },
    ]);

    const healthDistribution = await S2AcademicPerformance.aggregate([
      {
        $group: {
          _id: "$health_status",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const subjectStats = await S2AcademicPerformance.aggregate([
      {
        $group: {
          _id: "$subject",
          avg_health: { $avg: "$academic_health" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          avg_health: { $round: ["$avg_health", 1] },
          count: 1,
        },
      },
    ]);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      overall: stats[0] || null,
      health_distribution: healthDistribution,
      subject_stats: subjectStats,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S2 statistics", {
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  createS2,
  getAllS2,
  getS2ById,
  getLatestS2ByStudent,
  getS2History,
  getS2Trends,
  getClassPerformance,
  getS5Indicators,
  updateS2,
  deleteS2,
  bulkUploadS2,
  bulkDeleteS2,
  bulkDeleteS2ByStudent,
  getS2Stats,
};