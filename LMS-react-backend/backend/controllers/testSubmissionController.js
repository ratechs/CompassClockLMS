import TestSubmission from "../models/testSubmission.js";
import Test from "../models/testModel.js";
import Leaderboard from "../models/leaderBoardModel.js";
import mongoose from "mongoose";

// =============================================
// SUBMIT TEST - Supports All Three Test Types
// =============================================
export const submitTest = async (req, res) => {
    try {
        const {
            user,
            test,
            detailed_answers,
            submitted_at,
            time_spent,
            device_info
        } = req.body;

        // Validate required fields
        if (!user || !test || !detailed_answers) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: user, test, or detailed_answers"
            });
        }

        // Get test details
        const testData = await Test.findById(test);
        if (!testData) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        // =============================================
        // CALCULATE RESULTS BASED ON TEST TYPE
        // =============================================
        let submissionData = {
            user,
            test,
            test_name: testData.test_name,
            test_type: testData.test_type,
            total_questions: testData.total_questions || testData.test_questions.length,
            started_at: started_at || new Date(),
            time_taken_seconds: time_taken_seconds || 0,
            detailed_answers: detailed_answers,
            status: 'completed',
            submitted_at: new Date(),
            device_info: device_info || {}
        };

        // Process based on test type
        if (testData.test_type === 'correct_answer' || testData.test_type === 'pre-test' || testData.test_type === 'post-test') {
            // ===== CORRECT ANSWER TEST =====
            submissionData = await processCorrectAnswerTest(submissionData, testData);
        } 
        else if (testData.test_type === 'value_based') {
            // ===== VALUE-BASED TEST =====
            submissionData = await processValueBasedTest(submissionData, testData);
        } 
        else if (testData.test_type === 'assessment') {
            // ===== ASSESSMENT TEST =====
            submissionData = await processAssessmentTest(submissionData, testData);
        }

        // Save submission
        const submission = await TestSubmission.create(submissionData);

        // =============================================
        // UPDATE LEADERBOARD
        // =============================================
        await updateLeaderboardWithSubmission(submission, testData);

        // =============================================
        // PREPARE RESPONSE
        // =============================================
        const response = {
            success: true,
            data: submission,
            results: {
                test_type: testData.test_type,
                score: submission.score || 0,
                percentage: submission.percentage || 0,
                passed: submission.passed || false
            }
        };

        // Add type-specific results
        if (testData.test_type === 'correct_answer') {
            response.results.correct_answers = submission.correct_answers;
            response.results.wrong_answers = submission.wrong_answers;
            response.results.max_score = submission.max_score;
        } else if (testData.test_type === 'value_based') {
            response.results.total_value = submission.total_value;
            response.results.max_possible_value = submission.max_possible_value;
            response.results.level = submission.level;
            response.results.interpretations = submission.interpretations;
            response.results.recommendations = submission.recommendations;
        } else if (testData.test_type === 'assessment') {
            response.results.trait_scores = submission.trait_scores;
            response.results.primary_trait = submission.primary_trait;
            response.results.trait_interpretations = submission.trait_interpretations;
        }

        res.status(201).json(response);

    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// PROCESS CORRECT ANSWER TEST
// =============================================
const processCorrectAnswerTest = async (submissionData, testData) => {
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const processedAnswers = [];

    // Get question map for quick lookup
    const questionMap = new Map();
    testData.test_questions.forEach((q, index) => {
        questionMap.set(q._id.toString(), { ...q.toObject(), index });
    });

    submissionData.detailed_answers.forEach(answer => {
        const question = questionMap.get(answer.question_id?.toString());
        if (!question) {
            processedAnswers.push({
                ...answer,
                is_skipped: true,
                is_correct: false,
                marks_obtained: 0
            });
            skippedCount++;
            return;
        }

        const isCorrect = question.correct_options?.some(
            opt => answer.selected_options?.includes(opt)
        ) || false;

        const marksObtained = isCorrect 
            ? (question.positive_mark || 0) 
            : -(question.negative_mark || 0);

        totalScore += marksObtained;
        maxScore += question.positive_mark || 0;

        if (isCorrect) correctCount++;
        else if (!answer.is_skipped) wrongCount++;
        else skippedCount++;

        processedAnswers.push({
            ...answer,
            question_text: question.question_text,
            question_category: question.question_category || 'general',
            test_category: 'correct_answer',
            is_correct: isCorrect,
            correct_options: question.correct_options || [],
            marks_obtained: marksObtained,
            max_marks: question.positive_mark || 0,
            is_skipped: answer.is_skipped || false
        });
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= (testData.passing_percentage || 40);

    return {
        ...submissionData,
        detailed_answers: processedAnswers,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        skipped_questions: skippedCount,
        score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        passed: passed,
        passing_percentage: testData.passing_percentage || 40
    };
};

// =============================================
// PROCESS VALUE-BASED TEST
// =============================================
const processValueBasedTest = async (submissionData, testData) => {
    let totalValue = 0;
    let maxPossibleValue = 0;
    const processedAnswers = [];

    // Get question map for quick lookup
    const questionMap = new Map();
    testData.test_questions.forEach((q, index) => {
        questionMap.set(q._id.toString(), { ...q.toObject(), index });
    });

    submissionData.detailed_answers.forEach(answer => {
        const question = questionMap.get(answer.question_id?.toString());
        if (!question) {
            processedAnswers.push({
                ...answer,
                is_skipped: true,
                obtained_value: 0
            });
            return;
        }

        // Find selected option value
        let selectedValue = 0;
        let selectedText = '';
        if (answer.selected_options && answer.selected_options.length > 0) {
            const selectedOption = question.question_options.find(
                opt => opt.text === answer.selected_options[0]
            );
            selectedValue = selectedOption?.value || 0;
            selectedText = answer.selected_options[0];
        }

        const maxValue = Math.max(...question.question_options.map(opt => opt.value || 0));
        totalValue += selectedValue;
        maxPossibleValue += maxValue;

        processedAnswers.push({
            ...answer,
            question_text: question.question_text,
            question_category: question.question_category || 'general',
            test_category: 'value_based',
            selected_options: [selectedText],
            selected_values: [selectedValue],
            obtained_value: selectedValue,
            max_value: maxValue,
            value_percentage: maxValue > 0 ? (selectedValue / maxValue) * 100 : 0,
            is_skipped: answer.is_skipped || false
        });
    });

    const valuePercentage = maxPossibleValue > 0 ? (totalValue / maxPossibleValue) * 100 : 0;

    // Determine level based on scoring config
    let level = null;
    let interpretations = [];
    let recommendations = [];

    if (testData.value_scoring_config?.score_ranges) {
        for (const range of testData.value_scoring_config.score_ranges) {
            if (valuePercentage >= range.min_score && valuePercentage <= range.max_score) {
                level = range.level;
                interpretations.push(range.description);
                if (range.recommendations) {
                    recommendations.push(...range.recommendations);
                }
                break;
            }
        }
    }

    return {
        ...submissionData,
        detailed_answers: processedAnswers,
        total_value: totalValue,
        max_possible_value: maxPossibleValue,
        value_percentage: valuePercentage,
        score: totalValue, // For compatibility
        max_score: maxPossibleValue,
        percentage: valuePercentage,
        level: level,
        interpretations: interpretations,
        recommendations: recommendations,
        passed: false // Not applicable for value-based tests
    };
};

// =============================================
// PROCESS ASSESSMENT TEST
// =============================================
const processAssessmentTest = async (submissionData, testData) => {
    const traitMap = new Map();
    const processedAnswers = [];

    // Get question map for quick lookup
    const questionMap = new Map();
    testData.test_questions.forEach((q, index) => {
        questionMap.set(q._id.toString(), { ...q.toObject(), index });
    });

    submissionData.detailed_answers.forEach(answer => {
        const question = questionMap.get(answer.question_id?.toString());
        if (!question) {
            processedAnswers.push({
                ...answer,
                is_skipped: true
            });
            return;
        }

        // Get selected trait from option
        let selectedTrait = null;
        let traitScore = 0;
        let selectedText = '';

        if (answer.selected_options && answer.selected_options.length > 0) {
            selectedText = answer.selected_options[0];
            const selectedOption = question.question_options.find(
                opt => opt.text === selectedText
            );
            selectedTrait = selectedOption?.trait || question.trait_mapping || null;
            traitScore = 1; // Each selection counts as 1
        }

        // Update trait scores
        if (selectedTrait) {
            if (!traitMap.has(selectedTrait)) {
                traitMap.set(selectedTrait, { total: 0, count: 0 });
            }
            const trait = traitMap.get(selectedTrait);
            trait.total += traitScore;
            trait.count++;
        }

        processedAnswers.push({
            ...answer,
            question_text: question.question_text,
            question_category: question.question_category || 'general',
            test_category: 'assessment',
            selected_trait: selectedTrait,
            trait_score: traitScore,
            is_skipped: answer.is_skipped || false
        });
    });

    // Calculate trait averages and levels
    const traitScores = new Map();
    const traitInterpretations = new Map();
    
    traitMap.forEach((value, key) => {
        const average = value.total / value.count;
        const level = average >= 4 ? 'High' : average >= 3 ? 'Moderate' : 'Low';
        
        traitScores.set(key, {
            total: value.total,
            count: value.count,
            average: average,
            level: level
        });

        // Get interpretation from assessment guidelines
        let interpretation = '';
        if (testData.assessment_guidelines?.traits) {
            const traitInfo = testData.assessment_guidelines.traits.find(
                t => t.name === key
            );
            if (traitInfo) {
                interpretation = traitInfo.interpretation || '';
            }
        }
        traitInterpretations.set(key, interpretation);
    });

    // Find primary trait (highest average)
    let primaryTrait = null;
    let maxAverage = -Infinity;
    traitScores.forEach((value, key) => {
        if (value.average > maxAverage) {
            maxAverage = value.average;
            primaryTrait = key;
        }
    });

    return {
        ...submissionData,
        detailed_answers: processedAnswers,
        trait_scores: traitScores,
        trait_interpretations: traitInterpretations,
        primary_trait: primaryTrait,
        score: 0, // No score for assessment
        max_score: 0,
        percentage: 0,
        passed: false
    };
};

// =============================================
// UPDATE LEADERBOARD WITH SUBMISSION
// =============================================
const updateLeaderboardWithSubmission = async (submission, testData) => {
    try {
        // Get or create leaderboard
        let leaderboard = await Leaderboard.findOne({ test: submission.test });
        
        if (!leaderboard) {
            // Create new leaderboard
            leaderboard = new Leaderboard({
                test: submission.test,
                subject: testData.test_subject,
                lesson: testData.test_lesson,
                test_name: testData.test_name,
                test_type: testData.test_type,
                created_by: testData.created_by,
                leaderboard_type: testData.test_type === 'correct_answer' ? 'score_based' :
                                 testData.test_type === 'value_based' ? 'value_based' : 'trait_based',
                scoring_criteria: {
                    primary_field: testData.test_type === 'correct_answer' ? 'score' :
                                  testData.test_type === 'value_based' ? 'total_value' : 'primary_trait',
                    secondary_field: 'time_taken_seconds',
                    secondary_order: 'asc'
                }
            });
        }

        // Get user details
        const user = await mongoose.model('User').findById(submission.user);
        if (!user) {
            console.error('User not found for leaderboard update');
            return;
        }

        // Check if user already exists in rankings
        const existingIndex = leaderboard.rankings.findIndex(
            r => r.user.toString() === submission.user.toString()
        );

        // Create ranking entry
        const rankingEntry = {
            user: submission.user,
            user_name: user.name || 'Unknown User',
            user_email: user.email || '',
            user_avatar: user.avatar || null,
            submission_id: submission._id,
            score: submission.score || 0,
            max_score: submission.max_score || 0,
            percentage: submission.percentage || 0,
            correct_answers: submission.correct_answers || 0,
            wrong_answers: submission.wrong_answers || 0,
            total_value: submission.total_value || 0,
            max_possible_value: submission.max_possible_value || 0,
            value_percentage: submission.value_percentage || 0,
            level: submission.level || null,
            total_questions: submission.total_questions || 0,
            answered_questions: submission.answered_questions || 0,
            skipped_questions: submission.skipped_questions || 0,
            passed: submission.passed || false,
            time_taken_seconds: submission.time_taken_seconds || 0,
            submitted_at: submission.submitted_at || new Date(),
            trait_scores: submission.trait_scores || new Map(),
            primary_trait: submission.primary_trait || null
        };

        // Update or add ranking
        if (existingIndex !== -1) {
            // Keep previous rank for tracking
            rankingEntry.previous_rank = leaderboard.rankings[existingIndex].rank;
            leaderboard.rankings[existingIndex] = rankingEntry;
        } else {
            leaderboard.rankings.push(rankingEntry);
        }

        // Recalculate ranks
        leaderboard.recalculateRanks();
        await leaderboard.save();

        console.log(`Leaderboard updated for test: ${testData.test_name}`);
        
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        // Don't throw - leaderboard update shouldn't fail the submission
    }
};

// =============================================
// GET ALL SUBMISSIONS
// =============================================
export const getAllSubmissions = async (req, res) => {
    try {
        const submissions = await TestSubmission.find()
            .populate('user', 'name email avatar')
            .populate('test', 'test_name test_type')
            .populate({
                path: 'test',
                populate: {
                    path: 'test_subject test_lesson'
                }
            })
            .sort({ submitted_at: -1 });

        res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET SUBMISSION BY ID
// =============================================
export const getSubmissionById = async (req, res) => {
    try {
        const submission = await TestSubmission.findById(req.params.id)
            .populate('user', 'name email avatar')
            .populate('test', 'test_name test_type test_subject test_lesson')
            .populate({
                path: 'test',
                populate: {
                    path: 'test_subject test_lesson'
                }
            });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET SUBMISSIONS BY TEST ID
// =============================================
export const getSubmissionsByTestId = async (req, res) => {
    try {
        const { testId } = req.params;
        const { status, user, limit = 50, page = 1 } = req.query;

        // Build query
        const query = { test: testId };
        if (status) query.status = status;
        if (user) query.user = user;

        const skip = (page - 1) * limit;

        const submissions = await TestSubmission.find(query)
            .populate('user', 'name email avatar')
            .populate('test', 'test_name test_type')
            .sort({ submitted_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await TestSubmission.countDocuments(query);

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No submissions found for this test"
            });
        }

        res.status(200).json({
            success: true,
            count: submissions.length,
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: submissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET SUBMISSIONS BY USER ID
// =============================================
export const getSubmissionsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { test, limit = 20, page = 1 } = req.query;

        // Build query
        const query = { user: userId };
        if (test) query.test = test;

        const skip = (page - 1) * limit;

        const submissions = await TestSubmission.find(query)
            .populate('user', 'name email avatar')
            .populate('test', 'test_name test_type')
            .sort({ submitted_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await TestSubmission.countDocuments(query);

        res.status(200).json({
            success: true,
            count: submissions.length,
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: submissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET SUBMISSION STATISTICS
// =============================================
export const getSubmissionStatistics = async (req, res) => {
    try {
        const { testId } = req.params;

        const statistics = await TestSubmission.aggregate([
            { $match: { test: new mongoose.Types.ObjectId(testId), status: 'completed' } },
            {
                $group: {
                    _id: '$test_type',
                    total_submissions: { $sum: 1 },
                    average_score: { $avg: '$score' },
                    average_percentage: { $avg: '$percentage' },
                    highest_score: { $max: '$score' },
                    lowest_score: { $min: '$score' },
                    pass_count: {
                        $sum: { $cond: ['$passed', 1, 0] }
                    },
                    average_time: { $avg: '$time_taken_seconds' }
                }
            },
            {
                $project: {
                    test_type: '$_id',
                    total_submissions: 1,
                    average_score: { $round: ['$average_score', 2] },
                    average_percentage: { $round: ['$average_percentage', 2] },
                    highest_score: 1,
                    lowest_score: 1,
                    pass_rate: {
                        $round: [
                            { $multiply: [{ $divide: ['$pass_count', '$total_submissions'] }, 100] },
                            2
                        ]
                    },
                    average_time_minutes: {
                        $round: [{ $divide: ['$average_time', 60] }, 2]
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// DELETE SUBMISSION
// =============================================
export const deleteSubmission = async (req, res) => {
    try {
        const submission = await TestSubmission.findById(req.params.id);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        // Remove from leaderboard
        await Leaderboard.updateOne(
            { test: submission.test },
            { $pull: { rankings: { submission_id: submission._id } } }
        );

        await submission.deleteOne();

        res.status(200).json({
            success: true,
            message: "Submission deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// EXPORT ALL CONTROLLERS
// =============================================
export default {
    submitTest,
    getAllSubmissions,
    getSubmissionById,
    getSubmissionsByTestId,
    getSubmissionsByUserId,
    getSubmissionStatistics,
    deleteSubmission
};