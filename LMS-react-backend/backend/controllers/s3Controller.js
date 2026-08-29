// controllers/s3Controller.js
import S3RIASEC from "../models/S3_RIASEC.js";
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
  CREATED: "S3 RIASEC assessment created successfully",
  UPDATED: "S3 RIASEC assessment updated successfully",
  DELETED: "S3 RIASEC assessment deleted successfully",
  NOT_FOUND: "S3 RIASEC assessment not found",
  STUDENT_NOT_FOUND: "Student not found",
  BULK_SUCCESS: "Bulk upload completed",
  BULK_DELETE_SUCCESS: "S3 RIASEC assessments deleted successfully",
};

const sendResponse = (res, status, success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// ================================================================
// CREATE
// ================================================================

export const createS3 = async (req, res) => {
  try {
    const { student_id } = req.body;

    const student = await Student.findOne({ student_id });
    if (!student) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.STUDENT_NOT_FOUND);
    }

    const s3 = new S3RIASEC({
      ...req.body,
      assessed_by: req.user?._id,
    });

    await s3.save();

    return sendResponse(res, HTTP_STATUS.CREATED, true, MESSAGES.CREATED, s3);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error creating S3 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - All
// ================================================================

export const getAllS3 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      student_id,
      dominant_type,
      from_date,
      to_date,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (dominant_type) filter.dominant_type = dominant_type;

    if (from_date || to_date) {
      filter.assessment_date = {};
      if (from_date) filter.assessment_date.$gte = new Date(from_date);
      if (to_date) filter.assessment_date.$lte = new Date(to_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [assessments, total] = await Promise.all([
      S3RIASEC.find(filter)
        .populate("student_id", "full_name class section roll_number")
        .populate("assessed_by", "username email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      S3RIASEC.countDocuments(filter),
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
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S3 assessments", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Single
// ================================================================

export const getS3ById = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S3RIASEC.findById(id)
      .populate("student_id", "full_name class section roll_number parent_info")
      .populate("assessed_by", "username email");

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S3 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Latest by Student
// ================================================================

export const getLatestS3ByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S3RIASEC.getLatest(studentId)
      .populate("student_id", "full_name class section roll_number")
      .populate("assessed_by", "username email");

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S3 assessment found for this student");
    }

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching latest S3 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - By Dominant Type
// ================================================================

export const getS3ByType = async (req, res) => {
  try {
    const { type } = req.params;

    const assessments = await S3RIASEC.getByType(type);

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", {
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S3 by type", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Career Path
// ================================================================

export const getCareerPath = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S3RIASEC.getLatest(studentId);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S3 assessment found for this student");
    }

    const careerPath = assessment.getCareerPath();

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", careerPath);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching career path", {
      error: error.message,
    });
  }
};

// ================================================================
// READ - Learning Recommendations
// ================================================================

export const getLearningRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const assessment = await S3RIASEC.getLatest(studentId);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, "No S3 assessment found for this student");
    }

    const recommendations = assessment.getLearningRecommendations();

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", recommendations);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching learning recommendations", {
      error: error.message,
    });
  }
};

// ================================================================
// UPDATE
// ================================================================

export const updateS3 = async (req, res) => {
  try {
    const { id } = req.params;

    delete req.body.student_id;

    const assessment = await S3RIASEC.findByIdAndUpdate(
      id,
      {
        ...req.body,
        assessed_by: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.UPDATED, assessment);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error updating S3 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// DELETE
// ================================================================

export const deleteS3 = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await S3RIASEC.findByIdAndDelete(id);

    if (!assessment) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, MESSAGES.NOT_FOUND);
    }

    return sendResponse(res, HTTP_STATUS.OK, true, MESSAGES.DELETED, {
      id: assessment._id,
      student_id: assessment.student_id,
    });
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error deleting S3 assessment", {
      error: error.message,
    });
  }
};

// ================================================================
// BULK UPLOAD
// ================================================================

export const bulkUploadS3 = async (req, res) => {
  try {
    const { records, options = {} } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of S3 assessment records");
    }

    const results = await S3RIASEC.bulkUpsert(records, options);

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

export const bulkDeleteS3 = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of assessment IDs");
    }

    const results = await S3RIASEC.bulkDelete(ids);

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

export const bulkDeleteS3ByStudent = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, "Please provide an array of student IDs");
    }

    const results = await S3RIASEC.bulkDeleteByStudent(studentIds);

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

export const getS3Stats = async (req, res) => {
  try {
    const stats = await S3RIASEC.getStatistics();

    return sendResponse(res, HTTP_STATUS.OK, true, "Fetched successfully", stats);
  } catch (error) {
    return sendResponse(res, HTTP_STATUS.SERVER_ERROR, false, "Error fetching S3 statistics", {
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  createS3,
  getAllS3,
  getS3ById,
  getLatestS3ByStudent,
  getS3ByType,
  getCareerPath,
  getLearningRecommendations,
  updateS3,
  deleteS3,
  bulkUploadS3,
  bulkDeleteS3,
  bulkDeleteS3ByStudent,
  getS3Stats,
};