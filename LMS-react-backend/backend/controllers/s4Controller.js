// controllers/s4Controller.js
import { SWOTQuestionnaire, SWOTConsolidated } from "../models/s4_SWOT.js";
import Student from "../models/studentModel.js";
import S1LearningCultureSchema from "../models/S1LearningCultureSchema.js";
import S2_AcademicPerformance from '../models/S2_AcademicPerformance.js'
import S3_RIASEC from '../models/S3_RIASEC.js';
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
  CREATED: "SWOT questionnaire created successfully",
  UPDATED: "SWOT questionnaire updated successfully",
  DELETED: "SWOT questionnaire deleted successfully",
  NOT_FOUND: "SWOT questionnaire not found",
  STUDENT_NOT_FOUND: "Student not found",
  CONSOLIDATED_CREATED: "SWOT consolidated analysis generated successfully",
  CONSOLIDATED_NOT_FOUND: "SWOT consolidated analysis not found",
  BULK_SUCCESS: "Bulk upload completed",
  BULK_DELETE_SUCCESS: "SWOT records deleted successfully",
};

const sendResponse = (res, status, success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// ================================================================
// ================================================================
// SWOT QUESTIONNAIRE CONTROLLERS
// ================================================================
// ================================================================

// ----- CREATE QUESTIONNAIRE -----

export const createSWOTQuestionnaire = async (req, res) => {
  try {
    const { student_id } = req.body;

    const student = await Student.findOne({ student_id });
    if (!student) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.STUDENT_NOT_FOUND);
    }

    const questionnaire = new SWOTQuestionnaire({
      ...req.body,
      created_by: req.user?._id,
    });

    await questionnaire.save();

    return sendResponse(res, HTTP_STATUS.CREATED, true, MESSAGES.CREATED, questionnaire);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error creating SWOT questionnaire", {
      error: error.message,
    });
  }
};

// ----- GET ALL QUESTIONNAIRES -----

export const getAllSWOTQuestionnaires = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      student_id,
      responder_type,
      is_verified,
      from_date,
      to_date,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (responder_type) filter.responder_type = responder_type;
    if (is_verified !== undefined) filter.is_verified = is_verified === "true";

    if (from_date || to_date) {
      filter.submission_date = {};
      if (from_date) filter.submission_date.$gte = new Date(from_date);
      if (to_date) filter.submission_date.$lte = new Date(to_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [questionnaires, total] = await Promise.all([
      SWOTQuestionnaire.find(filter)
        .populate("student_id", "full_name class section roll_number")
        .populate("responder_id", "username email")
        .populate("verified_by", "username email")
        .populate("created_by", "username email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      SWOTQuestionnaire.countDocuments(filter),
    ]);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      questionnaires,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching SWOT questionnaires", {
      error: error.message,
    });
  }
};

// ----- GET QUESTIONNAIRE BY ID -----

export const getSWOTQuestionnaireById = async (req, res) => {
  try {
    const { id } = req.params;

    const questionnaire = await SWOTQuestionnaire.findById(id)
      .populate("student_id", "full_name class section roll_number parent_info")
      .populate("responder_id", "username email")
      .populate("verified_by", "username email")
      .populate("created_by", "username email");

    if (!questionnaire) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", questionnaire);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching SWOT questionnaire", {
      error: error.message,
    });
  }
};

// ----- GET QUESTIONNAIRES BY STUDENT -----

export const getSWOTByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { responder_type } = req.query;

    let query = { student_id: studentId };
    if (responder_type) query.responder_type = responder_type;

    const questionnaires = await SWOTQuestionnaire.find(query)
      .populate("student_id", "full_name class section")
      .populate("responder_id", "username email")
      .sort({ submission_date: -1 });

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      count: questionnaires.length,
      data: questionnaires,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching SWOT questionnaires", {
      error: error.message,
    });
  }
};

// ----- UPDATE QUESTIONNAIRE -----

export const updateSWOTQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;

    delete req.body.student_id;

    const questionnaire = await SWOTQuestionnaire.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updated_by: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!questionnaire) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.UPDATED, questionnaire);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error updating SWOT questionnaire", {
      error: error.message,
    });
  }
};

// ----- VERIFY QUESTIONNAIRE -----

export const verifySWOTQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;

    const questionnaire = await SWOTQuestionnaire.findByIdAndUpdate(
      id,
      {
        is_verified: true,
        verified_by: req.user?._id,
        verified_at: new Date(),
      },
      { new: true }
    );

    if (!questionnaire) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "SWOT questionnaire verified successfully", questionnaire);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error verifying SWOT questionnaire", {
      error: error.message,
    });
  }
};

// ----- DELETE QUESTIONNAIRE -----

export const deleteSWOTQuestionnaire = async (req, res) => {
  try {
    const { id } = req.params;

    const questionnaire = await SWOTQuestionnaire.findByIdAndDelete(id);

    if (!questionnaire) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.DELETED, {
      id: questionnaire._id,
      student_id: questionnaire.student_id,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error deleting SWOT questionnaire", {
      error: error.message,
    });
  }
};

// ================================================================
// ================================================================
// SWOT CONSOLIDATED CONTROLLERS
// ================================================================
// ================================================================

// ----- GENERATE CONSOLIDATED -----

export const generateSWOTConsolidated = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all data sources
    const [s1, s2, s3] = await Promise.all([
      S1LearningCulture.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
      S2AcademicPerformance.find({ student_id: studentId, is_latest: true }),
      S3RIASEC.findOne({ student_id: studentId }).sort({ createdAt: -1 }),
    ]);

    // Generate consolidated SWOT
    const consolidatedData = await SWOTConsolidated.generateFromQuestionnaires(studentId, { s1, s2, s3 });

    if (!consolidatedData || consolidatedData.total_items === 0) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No data available to generate SWOT analysis");
    }

    // Check if existing consolidated record exists
    const existing = await SWOTConsolidated.findOne({ student_id: studentId, is_latest: true });

    let result;
    if (existing) {
      result = await SWOTConsolidated.findByIdAndUpdate(
        existing._id,
        {
          ...consolidatedData,
          generated_by_id: req.user?._id,
          version: existing.version + 1,
        },
        { new: true }
      );
    } else {
      const consolidated = new SWOTConsolidated({
        ...consolidatedData,
        generated_by_id: req.user?._id,
      });
      result = await consolidated.save();
    }

    return sendResponse(res, HTTP_STATUS.CREATED, true, MESSAGES.CONSOLIDATED_CREATED, result);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error generating SWOT consolidated analysis", {
      error: error.message,
    });
  }
};

// ----- GET CONSOLIDATED -----

export const getSWOTConsolidated = async (req, res) => {
  try {
    const { studentId } = req.params;

    const consolidated = await SWOTConsolidated.getLatest(studentId);

    if (!consolidated) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.CONSOLIDATED_NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", consolidated);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching SWOT consolidated analysis", {
      error: error.message,
    });
  }
};

// ----- GET CONSOLIDATED HISTORY -----

export const getSWOTConsolidatedHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 5 } = req.query;

    const history = await SWOTConsolidated.getHistorical(studentId, parseInt(limit));

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      count: history.length,
      data: history,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching SWOT consolidated history", {
      error: error.message,
    });
  }
};

// ----- GET CONSOLIDATED BY ID -----

export const getSWOTConsolidatedById = async (req, res) => {
  try {
    const { id } = req.params;

    const consolidated = await SWOTConsolidated.findById(id)
      .populate("student_id", "full_name class section roll_number")
      .populate("generated_by_id", "username email");

    if (!consolidated) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.CONSOLIDATED_NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", consolidated);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching SWOT consolidated analysis", {
      error: error.message,
    });
  }
};

// ----- UPDATE CONSOLIDATED -----

export const updateSWOTConsolidated = async (req, res) => {
  try {
    const { id } = req.params;

    delete req.body.student_id;

    const consolidated = await SWOTConsolidated.findByIdAndUpdate(
      id,
      {
        ...req.body,
        generated_by_id: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!consolidated) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.CONSOLIDATED_NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "SWOT consolidated updated successfully", consolidated);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error updating SWOT consolidated analysis", {
      error: error.message,
    });
  }
};

// ----- DELETE CONSOLIDATED -----

export const deleteSWOTConsolidated = async (req, res) => {
  try {
    const { id } = req.params;

    const consolidated = await SWOTConsolidated.findByIdAndDelete(id);

    if (!consolidated) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.CONSOLIDATED_NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "SWOT consolidated deleted successfully", {
      id: consolidated._id,
      student_id: consolidated.student_id,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error deleting SWOT consolidated analysis", {
      error: error.message,
    });
  }
};

// ================================================================
// ================================================================
// BULK OPERATIONS
// ================================================================
// ================================================================

// ----- BULK UPLOAD QUESTIONNAIRES -----

export const bulkUploadSWOTQuestionnaires = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of SWOT questionnaire records");
    }

    const results = await SWOTQuestionnaire.bulkUpsert(records, options);

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

// ----- BULK UPLOAD CONSOLIDATED -----

export const bulkUploadSWOTConsolidated = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of SWOT consolidated records");
    }

    const results = await SWOTConsolidated.bulkUpsert(records, options);

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

// ----- BULK DELETE QUESTIONNAIRES -----

export const bulkDeleteSWOTQuestionnaires = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of questionnaire IDs");
    }

    const results = await SWOTQuestionnaire.bulkDelete(ids);

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.BULK_DELETE_SUCCESS, results);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error in bulk delete", {
      error: error.message,
    });
  }
};

// ----- BULK DELETE CONSOLIDATED -----

export const bulkDeleteSWOTConsolidated = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of consolidated IDs");
    }

    const results = await SWOTConsolidated.bulkDelete(ids);

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.BULK_DELETE_SUCCESS, results);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error in bulk delete", {
      error: error.message,
    });
  }
};

// ================================================================
// STATISTICS
// ================================================================

export const getS4Stats = async (req, res) => {
  try {
    const [questionnaireStats, consolidatedStats] = await Promise.all([
      SWOTQuestionnaire.aggregate([
        {
          $group: {
            _id: "$responder_type",
            count: { $sum: 1 },
            verified: { $sum: { $cond: ["$is_verified", 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
      SWOTConsolidated.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avg_strengths: { $avg: { $size: "$strengths" } },
            avg_weaknesses: { $avg: { $size: "$weaknesses" } },
            avg_opportunities: { $avg: { $size: "$opportunities" } },
            avg_threats: { $avg: { $size: "$threats" } },
          },
        },
      ]),
    ]);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      questionnaire_stats: questionnaireStats,
      consolidated_stats: consolidatedStats[0] || null,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S4 statistics", {
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  // Questionnaire CRUD
  createSWOTQuestionnaire,
  getAllSWOTQuestionnaires,
  getSWOTQuestionnaireById,
  getSWOTByStudent,
  updateSWOTQuestionnaire,
  verifySWOTQuestionnaire,
  deleteSWOTQuestionnaire,

  // Consolidated CRUD
  generateSWOTConsolidated,
  getSWOTConsolidated,
  getSWOTConsolidatedHistory,
  getSWOTConsolidatedById,
  updateSWOTConsolidated,
  deleteSWOTConsolidated,

  // Bulk Operations
  bulkUploadSWOTQuestionnaires,
  bulkUploadSWOTConsolidated,
  bulkDeleteSWOTQuestionnaires,
  bulkDeleteSWOTConsolidated,

  // Statistics
  getS4Stats,
};