// controllers/psychometricSubmissionController.js
import PsychometricTestSubmission from "../models/PsychomtericTestSubmission.js";
import Student from "../models/studentModel.js";
import {
  processS1,
  processS2,
  processS3,
  processS4,
  processS5,
} from "../services/psychometricProcessor.js";

// ================================================================
// START TEST
// ================================================================

export const startTest = async (req, res) => {
  try {
    const { student_id, device_info } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Check if student exists
    const student = await Student.findOne({ student_id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check for active submission
    let submission = await PsychometricTestSubmission.findActiveSubmission(student_id);

    if (!submission) {
      // Create new submission with default sections
      const defaultSections = getDefaultSections();

      submission = new PsychometricTestSubmission({
        student_id,
        test_snapshot: {
          title: "Holistic Student Assessment",
          version: "1.0",
          language: "en",
          sections: defaultSections,
          settings: {
            time_limit_minutes: 60,
            passing_percentage: 40,
            allow_retake: true,
            retake_delay_days: 30,
            show_results_immediately: true,
          },
        },
        device_info: device_info || { platform: "web", app_version: "1.0" },
        status: "not_started",
        started_at: new Date(),
        created_by: req.user?._id,
      });
      await submission.save();
    }

    return res.status(200).json({
      success: true,
      message: "Test started successfully",
      data: {
        submission_id: submission._id,
        current_section: submission.current_section,
        status: submission.status,
        progress: submission.progress_percentage,
        sections: {
          s1: { completed: submission.responses.s1.completed },
          s2: { completed: submission.responses.s2.completed },
          s3: { completed: submission.responses.s3.completed },
          s4: { completed: submission.responses.s4.completed },
          s5: { completed: submission.responses.s5.completed },
        },
      },
    });
  } catch (error) {
    console.error("Error starting test:", error);
    return res.status(500).json({
      success: false,
      message: "Error starting test",
      error: error.message,
    });
  }
};

// ================================================================
// GET SECTION QUESTIONS
// ================================================================

export const getSectionQuestions = async (req, res) => {
  try {
    const { submission_id, section } = req.params;

    const submission = await PsychometricTestSubmission.findById(submission_id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const questions = submission.getSectionQuestions(section);

    return res.status(200).json({
      success: true,
      data: {
        section,
        questions,
        total_questions: questions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching questions",
      error: error.message,
    });
  }
};

// ================================================================
// SAVE SECTION RESPONSE
// ================================================================

export const saveSectionResponse = async (req, res) => {
  try {
    const { submission_id, section, responses, time_spent_seconds } = req.body;

    if (!submission_id || !section || !responses) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: submission_id, section, responses",
      });
    }

    const validSections = ["s1", "s2", "s3", "s4", "s5"];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${validSections.join(", ")}`,
      });
    }

    const submission = await PsychometricTestSubmission.findById(submission_id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.responses[section].completed) {
      return res.status(400).json({
        success: false,
        message: "Section already completed",
      });
    }

    // Save response
    submission.saveSectionResponse(section, responses, time_spent_seconds || 0);

    // Process results if completed
    if (submission.is_completed) {
      await processSubmissionResults(submission);
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Section saved successfully",
      data: {
        submission_id: submission._id,
        current_section: submission.current_section,
        status: submission.status,
        is_completed: submission.is_completed,
        progress: submission.progress_percentage,
        completed_at: submission.completed_at,
        scores: submission.is_completed ? submission.scores : null,
      },
    });
  } catch (error) {
    console.error("Error saving section:", error);
    return res.status(500).json({
      success: false,
      message: "Error saving section",
      error: error.message,
    });
  }
};

// ================================================================
// GET SUBMISSION STATUS
// ================================================================

export const getSubmissionStatus = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const submission = await PsychometricTestSubmission.findActiveSubmission(student_id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "No active submission found for this student",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        submission_id: submission._id,
        current_section: submission.current_section,
        status: submission.status,
        is_completed: submission.is_completed,
        progress: submission.progress_percentage,
        started_at: submission.started_at,
        completed_at: submission.completed_at,
        total_time_seconds: submission.total_time_seconds,
        sections: {
          s1: {
            completed: submission.responses.s1.completed,
            time_spent: submission.responses.s1.time_spent_seconds,
          },
          s2: {
            completed: submission.responses.s2.completed,
            time_spent: submission.responses.s2.time_spent_seconds,
          },
          s3: {
            completed: submission.responses.s3.completed,
            time_spent: submission.responses.s3.time_spent_seconds,
          },
          s4: {
            completed: submission.responses.s4.completed,
            time_spent: submission.responses.s4.time_spent_seconds,
          },
          s5: {
            completed: submission.responses.s5.completed,
            time_spent: submission.responses.s5.time_spent_seconds,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching submission status:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching submission status",
      error: error.message,
    });
  }
};

// ================================================================
// GET SECTION DATA
// ================================================================

export const getSectionData = async (req, res) => {
  try {
    const { submission_id, section } = req.params;

    const submission = await PsychometricTestSubmission.findById(submission_id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const sectionData = submission.responses[section];
    if (!sectionData) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const questions = submission.getSectionQuestions(section);

    return res.status(200).json({
      success: true,
      data: {
        section,
        questions,
        responses: sectionData.responses,
        completed: sectionData.completed,
        time_spent_seconds: sectionData.time_spent_seconds,
      },
    });
  } catch (error) {
    console.error("Error fetching section data:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching section data",
      error: error.message,
    });
  }
};

// ================================================================
// GET COMPLETED SUBMISSIONS
// ================================================================

export const getCompletedSubmissions = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { limit = 10 } = req.query;

    const submissions = await PsychometricTestSubmission.findCompletedSubmissions(
      student_id,
      parseInt(limit)
    );

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching completed submissions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching completed submissions",
      error: error.message,
    });
  }
};

// ================================================================
// GET SUBMISSION RESULTS
// ================================================================

export const getSubmissionResults = async (req, res) => {
  try {
    const { submission_id } = req.params;

    const submission = await PsychometricTestSubmission.findById(submission_id)
      .populate("results.s1_id")
      .populate("results.s2_ids")
      .populate("results.s3_id")
      .populate("results.s4_id")
      .populate("results.s5_id");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (!submission.is_completed) {
      return res.status(400).json({
        success: false,
        message: "Submission is not completed yet",
      });
    }

    // Ensure final report exists
    if (!submission.final_report?.generation_date) {
      submission.generateFinalReport();
      await submission.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        submission_id: submission._id,
        student_id: submission.student_id,
        completed_at: submission.completed_at,
        total_time: submission.total_time_seconds,
        scores: submission.scores,
        results: {
          s1: submission.results.s1_id,
          s2: submission.results.s2_ids,
          s3: submission.results.s3_id,
          s4: submission.results.s4_id,
          s5: submission.results.s5_id,
        },
        final_report: submission.final_report,
      },
    });
  } catch (error) {
    console.error("Error fetching submission results:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching submission results",
      error: error.message,
    });
  }
};

// ================================================================
// GET ALL SUBMISSIONS (Admin)
// ================================================================

export const getAllSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, is_completed } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (is_completed !== undefined) filter.is_completed = is_completed === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [submissions, total] = await Promise.all([
      PsychometricTestSubmission.find(filter)
        .populate("student_id", "full_name student_id class")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PsychometricTestSubmission.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: error.message,
    });
  }
};

// ================================================================
// GET SUBMISSION STATISTICS
// ================================================================

export const getSubmissionStats = async (req, res) => {
  try {
    const stats = await PsychometricTestSubmission.getStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message,
    });
  }
};

// ================================================================
// HELPER: PROCESS SUBMISSION RESULTS
// ================================================================

const processSubmissionResults = async (submission) => {
  try {
    const { student_id, responses } = submission;
    const results = {};

    // Process S1
    if (responses.s1.completed) {
      const s1 = await processS1(student_id, responses.s1.responses);
      results.s1_id = s1._id;
      submission.scores.s1 = s1.overall_score || 0;
    }

    // Process S2
    if (responses.s2.completed) {
      const s2Results = await processS2(student_id, responses.s2.responses);
      results.s2_ids = s2Results.map((r) => r._id);
      const avgHealth = s2Results.reduce((sum, r) => sum + (r.academic_health || 0), 0) / s2Results.length;
      submission.scores.s2 = Math.round(avgHealth);
    }

    // Process S3
    if (responses.s3.completed) {
      const s3 = await processS3(student_id, responses.s3.responses);
      results.s3_id = s3._id;
      const scores = s3.scores || {};
      const maxScore = Math.max(...Object.values(scores));
      submission.scores.s3 = maxScore || 0;
    }

    // Process S4
    if (responses.s4.completed) {
      const s4 = await processS4(student_id, responses.s4.responses);
      results.s4_id = s4._id;
      const strengths = s4.strengths?.length || 0;
      submission.scores.s4 = Math.min(strengths * 20, 100);
    }

    // Process S5
    if (responses.s5.completed) {
      const s5 = await processS5(student_id, responses.s5.responses);
      results.s5_id = s5._id;
      const maxSeverity = s5.highest_severity || 0;
      submission.scores.s5 = maxSeverity;
    }

    submission.results = results;

    // Generate final report
    submission.generateFinalReport();

    await submission.save();
  } catch (error) {
    console.error("Error processing submission results:", error);
    throw error;
  }
};

// ================================================================
// HELPER: DEFAULT SECTIONS
// ================================================================

const getDefaultSections = () => {
  return {
    s1: {
      name: "Learning Culture",
      description: "Rate your learning habits on a scale of 1-10",
      questions: [
        { id: "s1_q1", text: "Rate your focus during lessons", field: "sit", type: "rating", min: 1, max: 10 },
        { id: "s1_q2", text: "Rate your calmness under pressure", field: "be_still", type: "rating", min: 1, max: 10 },
        { id: "s1_q3", text: "Rate your active listening", field: "listen", type: "rating", min: 1, max: 10 },
        { id: "s1_q4", text: "Rate your memory power", field: "memory_power", type: "rating", min: 1, max: 10 },
        { id: "s1_q5", text: "Rate your communication skills", field: "communication", type: "rating", min: 1, max: 10 },
        { id: "s1_q6", text: "Rate your critical thinking", field: "critical_thinking", type: "rating", min: 1, max: 10 },
        { id: "s1_q7", text: "Rate your time management", field: "wastage", type: "rating", min: 1, max: 10 },
        { id: "s1_q8", text: "Rate how often you make errors", field: "error", type: "rating", min: 1, max: 10 },
        { id: "s1_q9", text: "Rate how often you repeat mistakes", field: "mistake", type: "rating", min: 1, max: 10 }
      ],
      time_limit_minutes: 5
    },
    s2: {
      name: "Academic Performance",
      description: "Enter your academic scores for each subject",
      subjects: ["English", "Tamil", "Maths", "Science", "Social Science"],
      components: ["knowledge", "application", "problem_solving", "excellence"],
      time_limit_minutes: 10
    },
    s3: {
      name: "RIASEC Assessment",
      description: "Choose the option that best describes you",
      types: ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"],
      questions_per_type: 6,
      time_limit_minutes: 15,
      options: [
        { label: "Strongly Disagree", value: 1 },
        { label: "Disagree", value: 2 },
        { label: "Neutral", value: 3 },
        { label: "Agree", value: 4 },
        { label: "Strongly Agree", value: 5 }
      ]
    },
    s4: {
      name: "SWOT Analysis",
      description: "Answer the following questions",
      questions: [
        { id: "s4_q1", text: "What are your top 3 strengths?", field: "strengths", type: "text" },
        { id: "s4_q2", text: "What are your top 3 weaknesses?", field: "weaknesses", type: "text" },
        { id: "s4_q3", text: "What opportunities can help you grow?", field: "opportunities", type: "text" },
        { id: "s4_q4", text: "What threats affect your learning?", field: "threats", type: "text" }
      ],
      time_limit_minutes: 10
    },
    s5: {
      name: "Attack Analysis",
      description: "Rate your level for each factor on a scale of 0-100",
      attack_types: ["fear", "distraction", "peer_pressure", "self_doubt", "laziness", "arrogance", "anxiety", "burnout"],
      time_limit_minutes: 10
    }
  };
};

// ================================================================
// EXPORT
// ================================================================

export default {
  startTest,
  getSectionQuestions,
  saveSectionResponse,
  getSubmissionStatus,
  getSectionData,
  getCompletedSubmissions,
  getSubmissionResults,
  getAllSubmissions,
  getSubmissionStats,
};