// services/psychometricProcessor.js
import S1_LearningCulture from "../models/S1LearningCultureSchema.js";
import S2AcadeS2_AcademicPerformancemicPerformance from "../models/S2_AcademicPerformance.js";
import S3_RIASEC from "../models/S3_RIASEC.js";
import { SWOTQuestionnaire } from "../models/s4_SWOT.js";
import s5_AttackAnalysis from "../models/S5_AttackAnalysis.js";
import mongoose from "mongoose";

// ================================================================
// PROCESS S1 - Learning Culture
// ================================================================

export const processS1 = async (studentId, responses) => {
  try {
    const s1Data = {
      student_id: studentId,
      sit: responses.sit || 5,
      be_still: responses.be_still || 5,
      listen: responses.listen || 5,
      memory_power: responses.memory_power || 5,
      communication: responses.communication || 5,
      critical_thinking: responses.critical_thinking || 5,
      wastage: responses.wastage || 5,
      error: responses.error || 5,
      mistake: responses.mistake || 5,
      submitted_by: "student",
      notes: "Auto-generated from psychometric test",
    };

    const s1 = new S1LearningCulture(s1Data);
    await s1.save();
    return s1;
  } catch (error) {
    console.error("Error processing S1:", error);
    throw error;
  }
};

// ================================================================
// PROCESS S2 - Academic Performance
// ================================================================

export const processS2 = async (studentId, responses) => {
  try {
    const results = [];

    // responses should be an array of subjects with scores
    if (Array.isArray(responses)) {
      for (const subjectData of responses) {
        const s2Data = {
          student_id: studentId,
          subject: subjectData.subject || "General",
          exam_type: "Psychometric Assessment",
          exam_date: new Date(),
          scores: {
            knowledge: subjectData.scores?.knowledge || 0,
            application: subjectData.scores?.application || 0,
            problem_solving: subjectData.scores?.problem_solving || 0,
            excellence: subjectData.scores?.excellence || 0,
          },
          uploaded_by_name: "System",
          teacher_notes: "Auto-generated from psychometric test",
          is_latest: true,
        };

        const s2 = new S2AcademicPerformance(s2Data);
        await s2.save();
        results.push(s2);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing S2:", error);
    throw error;
  }
};

// ================================================================
// PROCESS S3 - RIASEC
// ================================================================

export const processS3 = async (studentId, responses) => {
  try {
    const s3Data = {
      student_id: studentId,
      scores: {
        realistic: responses.realistic || 0,
        investigative: responses.investigative || 0,
        artistic: responses.artistic || 0,
        social: responses.social || 0,
        enterprising: responses.enterprising || 0,
        conventional: responses.conventional || 0,
      },
      assessed_by: null,
      assessment_date: new Date(),
    };

    const s3 = new S3RIASEC(s3Data);
    await s3.save();
    return s3;
  } catch (error) {
    console.error("Error processing S3:", error);
    throw error;
  }
};

// ================================================================
// PROCESS S4 - SWOT
// ================================================================

export const processS4 = async (studentId, responses) => {
  try {
    const swotData = {
      student_id: studentId,
      responder_type: "student",
      responder_id: null,
      submission_date: new Date(),
      input_method: "app",
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
    };

    // Add responses if they exist
    if (responses.strengths) {
      swotData.strengths = responses.strengths.split(",").map((s) => ({
        area: s.trim(),
        evidence: "",
        description: "",
        rating: 4,
      }));
    }

    if (responses.weaknesses) {
      swotData.weaknesses = responses.weaknesses.split(",").map((w) => ({
        area: w.trim(),
        evidence: "",
        description: "",
        rating: 3,
      }));
    }

    if (responses.opportunities) {
      swotData.opportunities = responses.opportunities.split(",").map((o) => ({
        area: o.trim(),
        evidence: "",
        description: "",
        potential_impact: 4,
      }));
    }

    if (responses.threats) {
      swotData.threats = responses.threats.split(",").map((t) => ({
        area: t.trim(),
        evidence: "",
        description: "",
        severity: 4,
      }));
    }

    const s4 = new SWOTQuestionnaire(swotData);
    await s4.save();
    return s4;
  } catch (error) {
    console.error("Error processing S4:", error);
    throw error;
  }
};

// ================================================================
// PROCESS S5 - Attack Analysis
// ================================================================

export const processS5 = async (studentId, responses) => {
  try {
    // Build attacks array
    const attacks = [];
    const attackTypes = [
      "fear",
      "distraction",
      "peer_pressure",
      "self_doubt",
      "laziness",
      "arrogance",
      "anxiety",
      "burnout",
    ];

    attackTypes.forEach((type) => {
      const severity = responses[type] || 0;
      if (severity > 0) {
        attacks.push({
          type: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          severity: Math.min(severity, 100),
          level: severity >= 70 ? "High" : severity >= 40 ? "Medium" : severity >= 10 ? "Low" : "None",
          detected_from: ["Psychometric Test"],
          description: `Detected from psychometric assessment`,
          recommendations: [],
          indicators: [],
        });
      }
    });

    // Calculate overall risk
    const maxSeverity = Math.max(...Object.values(responses));
    const overallRiskLevel =
      maxSeverity >= 70 ? "High" : maxSeverity >= 40 ? "Medium" : maxSeverity >= 10 ? "Low" : "None";

    const s5Data = {
      student_id: studentId,
      attacks: attacks,
      attack_score_summary: {
        fear: responses.fear || 0,
        distraction: responses.distraction || 0,
        peer_pressure: responses.peer_pressure || 0,
        self_doubt: responses.self_doubt || 0,
        laziness: responses.laziness || 0,
        arrogance: responses.arrogance || 0,
        anxiety: responses.anxiety || 0,
        burnout: responses.burnout || 0,
      },
      overall_risk_level: overallRiskLevel,
      highest_attack: attacks.length > 0 ? attacks.reduce((a, b) => (a.severity > b.severity ? a : b)).type : null,
      highest_severity: maxSeverity,
      calculated_by: "AI",
      calculated_by_id: null,
      assessment_date: new Date(),
      input_sources: {},
    };

    const s5 = new S5AttackAnalysis(s5Data);
    await s5.save();
    return s5;
  } catch (error) {
    console.error("Error processing S5:", error);
    throw error;
  }
};

// ================================================================
// GENERATE FINAL REPORT
// ================================================================

export const generateFinalReport = async (studentId, results) => {
  try {
    const FinalReport = mongoose.model("FinalReport");

    const reportData = {
      student_id: studentId,
      assessment_date: new Date(),
      references: {
        s1_id: results.s1_id,
        s2_ids: results.s2_ids || [],
        s3_id: results.s3_id,
        s4_id: results.s4_id,
        s5_id: results.s5_id,
      },
      destination: {
        primary: {
          name: "Personalized Learning Path",
          description: "Based on comprehensive assessment",
          confidence: 75,
        },
        alternative: {
          name: "Skill Development Focus",
          description: "Based on identified gaps",
          confidence: 65,
        },
      },
      short_term_goals: [
        {
          description: "Improve focus and concentration",
          deadline: "1 month",
          progress: 0,
        },
        {
          description: "Build confidence in problem-solving",
          deadline: "2 months",
          progress: 0,
        },
      ],
      long_term_goals: [
        {
          description: "Achieve overall academic excellence",
          deadline: "6 months",
          progress: 0,
        },
        {
          description: "Develop strong career foundation",
          deadline: "12 months",
          progress: 0,
        },
      ],
      practice_list: [
        {
          activity: "Daily 15-minute mindfulness meditation",
          frequency: "Daily",
          duration: "15 min",
          completed: false,
        },
        {
          activity: "Weekly timed practice tests",
          frequency: "Weekly",
          duration: "1 hour",
          completed: false,
        },
      ],
      guidance: {
        teacher: [
          "Provide real-world examples to improve application",
          "Encourage group discussions",
        ],
        parent: [
          "Create a distraction-free study zone",
          "Monitor screen time",
        ],
        student: [
          "Set small achievable goals",
          "Practice self-reflection daily",
        ],
        counselor: [
          "Monitor anxiety levels",
          "Provide emotional support",
        ],
      },
      generated_by: "AI",
      generation_date: new Date(),
      version: 1,
    };

    const report = new FinalReport(reportData);
    await report.save();
    return report;
  } catch (error) {
    console.error("Error generating final report:", error);
    throw error;
  }
};

// ================================================================
// PROCESS ALL SECTIONS (Combined)
// ================================================================

export const processAllSections = async (testData) => {
  try {
    const { student_id, sections } = testData;
    const results = {};

    // Process S1
    if (sections.s1?.completed && sections.s1?.responses) {
      const s1 = await processS1(student_id, sections.s1.responses);
      results.s1_id = s1._id;
    }

    // Process S2
    if (sections.s2?.completed && sections.s2?.responses) {
      const s2 = await processS2(student_id, sections.s2.responses);
      results.s2_ids = s2.map((r) => r._id);
    }

    // Process S3
    if (sections.s3?.completed && sections.s3?.responses) {
      const s3 = await processS3(student_id, sections.s3.responses);
      results.s3_id = s3._id;
    }

    // Process S4
    if (sections.s4?.completed && sections.s4?.responses) {
      const s4 = await processS4(student_id, sections.s4.responses);
      results.s4_id = s4._id;
    }

    // Process S5
    if (sections.s5?.completed && sections.s5?.responses) {
      const s5 = await processS5(student_id, sections.s5.responses);
      results.s5_id = s5._id;
    }

    // Generate Final Report
    const report = await generateFinalReport(student_id, results);
    results.report_id = report._id;

    return results;
  } catch (error) {
    console.error("Error processing all sections:", error);
    throw error;
  }
};

// ================================================================
// EXPORT
// ================================================================

export default {
  processS1,
  processS2,
  processS3,
  processS4,
  processS5,
  generateFinalReport,
  processAllSections,
};