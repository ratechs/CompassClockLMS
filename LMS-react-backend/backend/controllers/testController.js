import Tests from "../models/testModel.js";
import TestSubmission from "../models/testSubmission.js";
import Leaderboard from "../models/leaderBoardModel.js";
import mongoose from "mongoose";

// =============================================
// CREATE TEST - Supports All Test Types
// =============================================
export const createTest = async (req, res) => {
    try {
        const testData = req.body.data || req.body;

        // Validate test type
        if (!testData.test_type) {
            return res.status(400).json({
                success: false,
                message: "test_type is required. Must be one of: correct_answer, assessment, value_based, pre-test, post-test"
            });
        }

        // Validate based on test type
        const validationError = validateTest(testData);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Set default values
        if (!testData.settings) {
            testData.settings = {
                time_limit_minutes: 30,
                passing_percentage: 40,
                show_score_immediately: true,
                show_correct_answers: true,
                show_explanations: true,
                negative_marking_enabled: false,
                shuffle_questions: false,
                shuffle_options: false,
                max_attempts: 1,
                allow_retake: false
            };
        }

        if (!testData.access) {
            testData.access = {
                type: "public",
                allowed_users: [],
                allowed_roles: [],
                allowed_groups: []
            };
        }

        const newTest = await Tests.create(testData);
        
        res.status(201).json({
            success: true,
            data: newTest,
            message: `Test created successfully with type: ${newTest.test_type}`
        });
    } catch (error) {
        console.error('Error creating test:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// VALIDATE TEST BASED ON TYPE
// =============================================
const validateTest = (testData) => {
    const { test_type, questions, assessment_config, value_config } = testData;

    if (!questions || questions.length === 0) {
        return "Test must have at least one question";
    }

    // Validate based on test type
    if (['correct_answer', 'pre-test', 'post-test'].includes(test_type)) {
        // Check each question has correct_options
        for (const question of questions) {
            if (!question.correct_options || question.correct_options.length === 0) {
                return `Question "${question.question_text}" must have at least one correct option`;
            }
            if (question.positive_mark === undefined || question.positive_mark === null) {
                return `Question "${question.question_text}" must have positive_mark defined`;
            }
            // Check options
            if (!question.options || question.options.length < 2) {
                return `Question "${question.question_text}" must have at least 2 options`;
            }
            // Check for empty options
            const hasEmptyOption = question.options.some(opt => !opt.option_text || opt.option_text.trim() === "");
            if (hasEmptyOption) {
                return `Question "${question.question_text}" has empty options`;
            }
        }
    } 
    else if (test_type === 'value_based') {
        // Check each question has options with values
        for (const question of questions) {
            if (!question.options || question.options.length === 0) {
                return `Question "${question.question_text}" must have options`;
            }
            // Check if options have values
            const hasValues = question.options.some(opt => opt.option_value !== null && opt.option_value !== undefined);
            if (!hasValues) {
                return `Question "${question.question_text}" must have at least one option with a value`;
            }
            // Check for empty options
            const hasEmptyOption = question.options.some(opt => !opt.option_text || opt.option_text.trim() === "");
            if (hasEmptyOption) {
                return `Question "${question.question_text}" has empty options`;
            }
        }
        // Check value config
        if (!value_config || !value_config.ranges || value_config.ranges.length === 0) {
            return "Value-based tests require value_config with at least one range";
        }
    } 
    else if (test_type === 'assessment') {
        // Check each question
        for (const question of questions) {
            if (!question.options || question.options.length === 0) {
                return `Question "${question.question_text}" must have options`;
            }
            // Check if options have traits
            const hasTraits = question.options.some(opt => opt.option_trait);
            if (!hasTraits) {
                return `Question "${question.question_text}" must have at least one option with a trait`;
            }
            // Check for empty options
            const hasEmptyOption = question.options.some(opt => !opt.option_text || opt.option_text.trim() === "");
            if (hasEmptyOption) {
                return `Question "${question.question_text}" has empty options`;
            }
        }
        // Check assessment config
        if (!assessment_config || !assessment_config.traits || assessment_config.traits.length === 0) {
            return "Assessment tests require assessment_config with at least one trait";
        }
    }

    return null; // No validation error
};

// =============================================
// GET ALL TESTS
// =============================================
export const getAllTests = async (req, res) => {
    try {
        const { test_type, status, category, sub_category, limit = 50, page = 1 } = req.query;

        const query = {};
        if (test_type) query.test_type = test_type;
        if (status) query.test_status = status;
        if (category) query.category = category;
        if (sub_category) query.sub_category = sub_category;

        const skip = (page - 1) * limit;

        const tests = await Tests.find(query)
            .populate('category', 'name description')
            .populate('sub_category', 'name description')
            .populate('created_by', 'name email username role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Tests.countDocuments(query);

        // Transform the data to ensure consistent structure
        const transformedTests = tests.map(test => {
            const testObj = test.toObject();
            
            // If category is still a string, convert to object
            if (typeof testObj.category === 'string') {
                testObj.category = {
                    _id: testObj.category,
                    name: 'Category',
                    description: ''
                };
            }
            
            // If sub_category is still a string, convert to object
            if (typeof testObj.sub_category === 'string') {
                testObj.sub_category = {
                    _id: testObj.sub_category,
                    name: 'Subject',
                    description: ''
                };
            }
            
            // If created_by is null or string, provide default
            if (!testObj.created_by || typeof testObj.created_by === 'string') {
                testObj.created_by = {
                    _id: testObj.created_by || null,
                    name: 'Unknown Creator',
                    username: 'unknown',
                    email: '',
                    role: 'user'
                };
            }
            
            return testObj;
        });

        res.status(200).json({
            success: true,
            count: tests.length,
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: transformedTests
        });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET TEST BY ID
// =============================================
export const getTestById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID format"
            });
        }

        const test = await Tests.findById(id)
            .populate('category', 'name description')
            .populate('sub_category', 'name description')
            .populate('created_by', 'name email username role');

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        res.status(200).json({
            success: true,
            data: test
        });
    } catch (error) {
        console.error('Error fetching test:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET TESTS BY TYPE
// =============================================
export const getTestsByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { category, sub_category, status } = req.query;

        // Validate test type
        const validTypes = ['pre-test', 'post-test', 'correct_answer', 'assessment', 'value_based'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid test type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // Build query
        const query = { test_type: type };
        if (category) query.category = category;
        if (sub_category) query.sub_category = sub_category;
        if (status) query.test_status = status;

        const tests = await Tests.find(query)
            .populate('category', 'name description')
            .populate('sub_category', 'name description')
            .populate('created_by', 'name email username role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tests.length,
            data: tests
        });
    } catch (error) {
        console.error('Error fetching tests by type:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// UPDATE TEST
// =============================================
export const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        // Check if test exists
        const existingTest = await Tests.findById(id);
        if (!existingTest) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        // If test type is being changed, validate new data
        if (updateData.test_type && updateData.test_type !== existingTest.test_type) {
            const validationError = validateTest({
                ...existingTest.toObject(),
                ...updateData
            });
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }
        }

        // Remove created_by from updateData if it's null or undefined
        // This prevents overwriting the existing created_by
        if (updateData.created_by === null || updateData.created_by === undefined || updateData.created_by === '') {
            delete updateData.created_by;
        }

        // Remove _id and __v from updateData if present
        delete updateData._id;
        delete updateData.__v;

        // Update test
        const updatedTest = await Tests.findByIdAndUpdate(
            id,
            { 
                ...updateData, 
                created_by: req.user?.id || null 
            },
            { 
                new: true, 
                runValidators: true 
            }
        )
        .populate('category', 'name description')
        .populate('sub_category', 'name description')
        .populate('created_by', 'name email username role')
        .populate('created_by', 'name email username role');

        res.status(200).json({
            success: true,
            data: updatedTest,
            message: "Test updated successfully"
        });
    } catch (error) {
        console.error('Error updating test:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
// =============================================
// DELETE TEST
// =============================================
export const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        // Check if test exists
        const test = await Tests.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        // Check if there are submissions for this test
        const submissions = await TestSubmission.countDocuments({ test: id });
        if (submissions > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete test. ${submissions} submissions exist. Archive it instead.`
            });
        }

        // Delete test
        await Tests.findByIdAndDelete(id);

        // Also delete related leaderboard
        await Leaderboard.findOneAndDelete({ test: id });

        res.status(200).json({
            success: true,
            message: "Test deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting test:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// UPDATE TEST STATUS
// =============================================
export const updateTestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        // Validate status
        const validStatuses = ['enabled', 'disabled', 'draft', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updatedTest = await Tests.findByIdAndUpdate(
            id,
            { 
                test_status: status,
                created_by: req.user?.id || null
            },
            { new: true }
        )
        .populate('category', 'name description')
        .populate('sub_category', 'name description')
        .populate('created_by', 'name email username role');

        if (!updatedTest) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        res.status(200).json({
            success: true,
            data: updatedTest,
            message: `Test status updated to: ${status}`
        });
    } catch (error) {
        console.error('Error updating test status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// DUPLICATE TEST
// =============================================
export const duplicateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        // Get original test
        const originalTest = await Tests.findById(id);
        if (!originalTest) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        // Create duplicate
        const testData = originalTest.toObject();
        delete testData._id;
        delete testData.createdAt;
        delete testData.updatedAt;
        delete testData.__v;
        delete testData.statistics;

        // Update test title
        testData.title = title || `${originalTest.title} (Copy)`;
        testData.test_status = 'draft';
        testData.is_published = false;
        testData.published_at = null;
        testData.created_by = req.user?.id || originalTest.created_by;

        // Deep clone questions
        testData.questions = testData.questions.map(q => ({
            ...q,
            _id: new mongoose.Types.ObjectId()
        }));

        const newTest = await Tests.create(testData);

        res.status(201).json({
            success: true,
            data: newTest,
            message: "Test duplicated successfully"
        });
    } catch (error) {
        console.error('Error duplicating test:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET TEST STATISTICS
// =============================================
export const getTestStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        // Get test details
        const test = await Tests.findById(id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        // Get submissions statistics
        const stats = await TestSubmission.aggregate([
            { $match: { test: new mongoose.Types.ObjectId(id), status: 'completed' } },
            {
                $group: {
                    _id: null,
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
            }
        ]);

        // Get top performers
        const leaderboard = await Leaderboard.findOne({ test: id });
        const topPerformers = leaderboard ? leaderboard.getTopPerformers(10) : [];

        const statistics = {
            test_name: test.title,
            test_type: test.test_type,
            total_questions: test.questions?.length || 0,
            total_marks: test.questions?.reduce((sum, q) => sum + (q.positive_mark || 0), 0) || 0,
            status: test.test_status || 'draft',
            submissions: stats.length > 0 ? {
                total: stats[0].total_submissions,
                average_score: stats[0].average_score?.toFixed(2) || 0,
                average_percentage: stats[0].average_percentage?.toFixed(2) || 0,
                highest_score: stats[0].highest_score || 0,
                lowest_score: stats[0].lowest_score || 0,
                pass_rate: stats[0].total_submissions > 0 
                    ? ((stats[0].pass_count / stats[0].total_submissions) * 100).toFixed(2) 
                    : 0,
                average_time_minutes: stats[0].average_time 
                    ? (stats[0].average_time / 60).toFixed(2) 
                    : 0
            } : {
                total: 0,
                average_score: 0,
                average_percentage: 0,
                highest_score: 0,
                lowest_score: 0,
                pass_rate: 0,
                average_time_minutes: 0
            },
            top_performers: topPerformers
        };

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error fetching test statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET TESTS BY CATEGORY/SUB_CATEGORY
// =============================================
export const getTestsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { sub_category, type, status } = req.query;

        if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const query = { category: categoryId };
        if (sub_category) query.sub_category = sub_category;
        if (type) query.test_type = type;
        if (status) query.test_status = status;

        const tests = await Tests.find(query)
            .populate('category', 'name description')
            .populate('sub_category', 'name description')
            .populate('created_by', 'name email username role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tests.length,
            data: tests
        });
    } catch (error) {
        console.error('Error fetching tests by category:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// BULK UPDATE TEST STATUS
// =============================================
export const bulkUpdateTestStatus = async (req, res) => {
    try {
        const { testIds, status } = req.body;

        if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "testIds array is required"
            });
        }

        const validStatuses = ['enabled', 'disabled', 'draft', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const result = await Tests.updateMany(
            { _id: { $in: testIds } },
            { 
                test_status: status,
                created_by: req.user?.id || null
            }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} tests updated successfully`,
            data: {
                modified: result.modifiedCount,
                matched: result.matchedCount
            }
        });
    } catch (error) {
        console.error('Error bulk updating tests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// PUBLISH/UNPUBLISH TEST
// =============================================
export const publishTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_published } = req.body;

        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                message: "Invalid test ID"
            });
        }

        const updatedTest = await Tests.findByIdAndUpdate(
            id,
            { 
                is_published: is_published,
                published_at: is_published ? new Date() : null,
                created_by: req.user?.id || null
            },
            { new: true }
        );

        if (!updatedTest) {
            return res.status(404).json({
                success: false,
                message: "Test not found"
            });
        }

        res.status(200).json({
            success: true,
            data: updatedTest,
            message: `Test ${is_published ? 'published' : 'unpublished'} successfully`
        });
    } catch (error) {
        console.error('Error publishing test:', error);
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
    createTest,
    getAllTests,
    getTestById,
    getTestsByType,
    updateTest,
    deleteTest,
    updateTestStatus,
    duplicateTest,
    getTestStatistics,
    getTestsByCategory,
    bulkUpdateTestStatus,
    publishTest
};