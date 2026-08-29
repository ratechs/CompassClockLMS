// controllers/psychometricController.js
import PsychometricTest from "../models/PsychometricTest.js";
import Student from "../models/studentModel.js";
import {
  processS1,
  processS2,
  processS3,
  processS4,
  processS5,
  processAllSections,
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

    const student = await Student.findOne({ student_id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let test = await PsychometricTest.findOne({
      student_id,
      status: { $in: ["not_started", "in_progress", "paused"] },
    });

    if (!test) {
      test = new PsychometricTest({
        student_id,
        device_info: device_info || { platform: "web", app_version: "1.0" },
        status: "not_started",
        started_at: new Date(),
        created_by: req.user?._id,
      });
      await test.save();
    }

    return res.status(200).json({
      success: true,
      message: "Test started successfully",
      data: {
        test_id: test._id,
        current_section: test.current_section,
        status: test.status,
        sections: {
          s1: { completed: test.sections.s1.completed },
          s2: { completed: test.sections.s2.completed },
          s3: { completed: test.sections.s3.completed },
          s4: { completed: test.sections.s4.completed },
          s5: { completed: test.sections.s5.completed },
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
    const { section } = req.params;
    const questions = getQuestionsForSection(section);

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
    const { test_id, section, responses, time_spent_seconds } = req.body;

    if (!test_id || !section || !responses) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: test_id, section, responses",
      });
    }

    const validSections = ["s1", "s2", "s3", "s4", "s5"];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${validSections.join(", ")}`,
      });
    }

    const test = await PsychometricTest.findById(test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    if (test.sections[section].completed) {
      return res.status(400).json({
        success: false,
        message: "Section already completed",
      });
    }

    test.sections[section].responses = responses;
    test.sections[section].completed = true;
    test.sections[section].time_spent_seconds = time_spent_seconds || 0;
    test.last_activity_at = new Date();
    test.total_time_seconds += time_spent_seconds || 0;

    const sectionIndex = validSections.indexOf(section);
    if (sectionIndex < validSections.length - 1) {
      test.current_section = validSections[sectionIndex + 1];
      test.status = "in_progress";
    } else {
      test.current_section = "completed";
      test.status = "completed";
      test.is_completed = true;
      test.completed_at = new Date();

      try {
        const results = await processAllSections({
          student_id: test.student_id,
          sections: test.sections,
        });
        test.results.s1_id = results.s1_id || null;
        test.results.s2_ids = results.s2_ids || [];
        test.results.s3_id = results.s3_id || null;
        test.results.s4_id = results.s4_id || null;
        test.results.s5_id = results.s5_id || null;
        test.results.report_id = results.report_id || null;
      } catch (error) {
        console.error("Error processing results:", error);
      }
    }

    await test.save();

    return res.status(200).json({
      success: true,
      message: "Section saved successfully",
      data: {
        test_id: test._id,
        current_section: test.current_section,
        status: test.status,
        is_completed: test.is_completed,
        completed_at: test.completed_at,
        results: test.is_completed ? {
          s1_id: test.results.s1_id,
          s2_ids: test.results.s2_ids,
          s3_id: test.results.s3_id,
          s4_id: test.results.s4_id,
          s5_id: test.results.s5_id,
          report_id: test.results.report_id,
        } : null,
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
// GET TEST STATUS
// ================================================================

export const getTestStatus = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const test = await PsychometricTest.findOne({ student_id })
      .sort({ createdAt: -1 });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "No test found for this student",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        test_id: test._id,
        current_section: test.current_section,
        status: test.status,
        is_completed: test.is_completed,
        started_at: test.started_at,
        completed_at: test.completed_at,
        total_time_seconds: test.total_time_seconds,
        sections: {
          s1: { completed: test.sections.s1.completed, time_spent: test.sections.s1.time_spent_seconds },
          s2: { completed: test.sections.s2.completed, time_spent: test.sections.s2.time_spent_seconds },
          s3: { completed: test.sections.s3.completed, time_spent: test.sections.s3.time_spent_seconds },
          s4: { completed: test.sections.s4.completed, time_spent: test.sections.s4.time_spent_seconds },
          s5: { completed: test.sections.s5.completed, time_spent: test.sections.s5.time_spent_seconds },
        },
        results: test.is_completed ? {
          s1_id: test.results.s1_id,
          s2_ids: test.results.s2_ids,
          s3_id: test.results.s3_id,
          s4_id: test.results.s4_id,
          s5_id: test.results.s5_id,
          report_id: test.results.report_id,
        } : null,
      },
    });
  } catch (error) {
    console.error("Error fetching test status:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching test status",
      error: error.message,
    });
  }
};

// ================================================================
// GET SECTION DATA
// ================================================================

export const getSectionData = async (req, res) => {
  try {
    const { test_id, section } = req.params;

    const test = await PsychometricTest.findById(test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const sectionData = test.sections[section];
    if (!sectionData) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const questions = getQuestionsForSection(section);

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
// GET STUDENT TESTS
// ================================================================

export const getStudentTests = async (req, res) => {
  try {
    const { student_id } = req.params;

    const tests = await PsychometricTest.find({ student_id })
      .sort({ createdAt: -1 })
      .select("status is_completed started_at completed_at current_section total_time_seconds");

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching student tests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student tests",
      error: error.message,
    });
  }
};

// ================================================================
// PAUSE TEST
// ================================================================

export const pauseTest = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await PsychometricTest.findById(test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    if (test.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Test already completed",
      });
    }

    test.status = "paused";
    test.last_activity_at = new Date();
    await test.save();

    return res.status(200).json({
      success: true,
      message: "Test paused successfully",
      data: {
        test_id: test._id,
        status: test.status,
        current_section: test.current_section,
      },
    });
  } catch (error) {
    console.error("Error pausing test:", error);
    return res.status(500).json({
      success: false,
      message: "Error pausing test",
      error: error.message,
    });
  }
};

// ================================================================
// RESUME TEST
// ================================================================

export const resumeTest = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await PsychometricTest.findById(test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    if (test.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Test already completed",
      });
    }

    test.status = "in_progress";
    test.last_activity_at = new Date();
    await test.save();

    return res.status(200).json({
      success: true,
      message: "Test resumed successfully",
      data: {
        test_id: test._id,
        status: test.status,
        current_section: test.current_section,
        sections: {
          s1: { completed: test.sections.s1.completed },
          s2: { completed: test.sections.s2.completed },
          s3: { completed: test.sections.s3.completed },
          s4: { completed: test.sections.s4.completed },
          s5: { completed: test.sections.s5.completed },
        },
      },
    });
  } catch (error) {
    console.error("Error resuming test:", error);
    return res.status(500).json({
      success: false,
      message: "Error resuming test",
      error: error.message,
    });
  }
};

// ================================================================
// GET TEST RESULTS
// ================================================================

export const getTestResults = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await PsychometricTest.findById(test_id)
      .populate("results.s1_id")
      .populate("results.s2_ids")
      .populate("results.s3_id")
      .populate("results.s4_id")
      .populate("results.s5_id")
      .populate("results.report_id");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    if (!test.is_completed) {
      return res.status(400).json({
        success: false,
        message: "Test is not completed yet",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        test_id: test._id,
        student_id: test.student_id,
        completed_at: test.completed_at,
        total_time: test.total_time_seconds,
        results: {
          s1: test.results.s1_id,
          s2: test.results.s2_ids,
          s3: test.results.s3_id,
          s4: test.results.s4_id,
          s5: test.results.s5_id,
          report: test.results.report_id,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching test results:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching test results",
      error: error.message,
    });
  }
};

// ================================================================
// HELPER: GET QUESTIONS FOR SECTION
// ================================================================

const getQuestionsForSection = (section) => {
  const questionBank = {
    s1: [
      { id: "s1_q1", text: "Rate your focus during lessons", field: "sit", type: "rating", min: 1, max: 10 },
      { id: "s1_q2", text: "Rate your calmness under pressure", field: "be_still", type: "rating", min: 1, max: 10 },
      { id: "s1_q3", text: "Rate your active listening", field: "listen", type: "rating", min: 1, max: 10 },
      { id: "s1_q4", text: "Rate your memory power", field: "memory_power", type: "rating", min: 1, max: 10 },
      { id: "s1_q5", text: "Rate your communication skills", field: "communication", type: "rating", min: 1, max: 10 },
      { id: "s1_q6", text: "Rate your critical thinking", field: "critical_thinking", type: "rating", min: 1, max: 10 },
      { id: "s1_q7", text: "Rate your time management", field: "wastage", type: "rating", min: 1, max: 10 },
      { id: "s1_q8", text: "Rate how often you make errors", field: "error", type: "rating", min: 1, max: 10 },
      { id: "s1_q9", text: "Rate how often you repeat mistakes", field: "mistake", type: "rating", min: 1, max: 10 },
    ],
    s2: [
      { id: "s2_q1", text: "Rate your Knowledge", field: "knowledge", type: "score", min: 0, max: 100 },
      { id: "s2_q2", text: "Rate your Application", field: "application", type: "score", min: 0, max: 100 },
      { id: "s2_q3", text: "Rate your Problem Solving", field: "problem_solving", type: "score", min: 0, max: 100 },
      { id: "s2_q4", text: "Rate your Excellence", field: "excellence", type: "score", min: 0, max: 100 },
    ],
    s3: [
      { id: "s3_q1", text: "I enjoy hands-on activities", field: "realistic", type: "mcq" },
      { id: "s3_q2", text: "I enjoy solving puzzles", field: "investigative", type: "mcq" },
      { id: "s3_q3", text: "I enjoy creative activities", field: "artistic", type: "mcq" },
      { id: "s3_q4", text: "I enjoy helping others", field: "social", type: "mcq" },
      { id: "s3_q5", text: "I enjoy leading teams", field: "enterprising", type: "mcq" },
      { id: "s3_q6", text: "I enjoy organizing things", field: "conventional", type: "mcq" },
    ],
    s4: [
      { id: "s4_q1", text: "What are your top 3 strengths?", field: "strengths", type: "text" },
      { id: "s4_q2", text: "What are your top 3 weaknesses?", field: "weaknesses", type: "text" },
      { id: "s4_q3", text: "What opportunities can help you grow?", field: "opportunities", type: "text" },
      { id: "s4_q4", text: "What threats affect your learning?", field: "threats", type: "text" },
    ],
    s5: [
      { id: "s5_q1", text: "Rate your fear level", field: "fear", type: "rating", min: 0, max: 100 },
      { id: "s5_q2", text: "Rate your distraction level", field: "distraction", type: "rating", min: 0, max: 100 },
      { id: "s5_q3", text: "Rate your peer pressure level", field: "peer_pressure", type: "rating", min: 0, max: 100 },
      { id: "s5_q4", text: "Rate your self-doubt level", field: "self_doubt", type: "rating", min: 0, max: 100 },
      { id: "s5_q5", text: "Rate your laziness level", field: "laziness", type: "rating", min: 0, max: 100 },
      { id: "s5_q6", text: "Rate your arrogance level", field: "arrogance", type: "rating", min: 0, max: 100 },
      { id: "s5_q7", text: "Rate your anxiety level", field: "anxiety", type: "rating", min: 0, max: 100 },
      { id: "s5_q8", text: "Rate your burnout level", field: "burnout", type: "rating", min: 0, max: 100 },
    ],
  };

  return questionBank[section] || [];
};

// controllers/psychometricController.js

// ================================================================
// CREATE TEST (ADMIN ONLY)
// ================================================================

export const createPsychometricTest = async (req, res) => {
  try {
    const { title, version, sections, settings, language } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Create test template
    const testData = {
      title,
      version: version || "1.0",
      language: language || "en",
      sections: sections || getDefaultSections(),
      settings: settings || {
        time_limit_minutes: 60,
        passing_percentage: 40,
        allow_retake: true,
        retake_delay_days: 30,
        show_results_immediately: true,
      },
      is_active: true,
      created_by: req.user?._id,
    };

    // Save to PsychometricTest model (or your Test model)
    const test = new PsychometricTest(testData);
    await test.save();

    return res.status(201).json({
      success: true,
      message: "Psychometric test created successfully",
      data: {
        test_id: test._id,
        title: test.title,
        version: test.version,
        sections: Object.keys(test.sections),
      },
    });
  } catch (error) {
    console.error("Error creating test:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating test",
      error: error.message,
    });
  }
};

// ================================================================
// GET DEFAULT SECTIONS
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
// UPDATE TEST
// ================================================================

export const updatePsychometricTest = async (req, res) => {
  try {
    const { test_id } = req.params;
    const updateData = req.body;

    const test = await PsychometricTest.findByIdAndUpdate(
      test_id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error updating test:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating test",
      error: error.message,
    });
  }
};

// ================================================================
// GET ALL TESTS (ADMIN)
// ================================================================

export const getAllPsychometricTests = async (req, res) => {
  try {
    const tests = await PsychometricTest.find()
      .populate("created_by", "username email")
      .sort({ createdAt: -1 })
      .select("title test_version is_active created_at sections language")
      .lean();

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching tests",
      error: error.message,
    });
  }
};

// ================================================================
// GET SINGLE TEST
// ================================================================

export const getPsychometricTestById = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await PsychometricTest.findById(test_id)
      .populate("created_by", "username email");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error("Error fetching test:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching test",
      error: error.message,
    });
  }
};

// ================================================================
// DELETE TEST
// ================================================================

export const deletePsychometricTest = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await PsychometricTest.findByIdAndDelete(test_id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting test",
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  startTest,
  getSectionQuestions,
  saveSectionResponse,
  getTestStatus,
  getSectionData,
  getStudentTests,
  pauseTest,
  resumeTest,
  getTestResults,
  createPsychometricTest,
  updatePsychometricTest,
  deletePsychometricTest,
  getPsychometricTestById,
  getAllPsychometricTests,
  getAllPsychometricTests,
  getDefaultSections,
};