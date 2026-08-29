import Leaderboard from "../models/leaderBoardModel.js";
import Test from "../models/testModel.js";
import TestSubmission from "../models/testSubmission.js";
import mongoose from "mongoose";

// =============================================
// UPDATE LEADERBOARD - Supports All Test Types
// =============================================
export const updateLeaderboard = async (testId, subjectId, lessonId, userId, score, submissionId = null) => {
    try {
        // Get test details to determine type
        const test = await Test.findById(testId);
        if (!test) {
            throw new Error("Test not found");
        }

        // Get user details
        const user = await mongoose.model('User').findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Get or create leaderboard
        let leaderboard = await Leaderboard.findOne({ 
            test: testId, 
            subject: subjectId, 
            lesson: lessonId 
        });

        if (!leaderboard) {
            leaderboard = new Leaderboard({
                test: testId,
                subject: subjectId,
                lesson: lessonId,
                test_name: test.test_name,
                test_type: test.test_type,
                created_by: test.created_by || userId,
                leaderboard_type: test.test_type === 'correct_answer' ? 'score_based' :
                                  test.test_type === 'value_based' ? 'value_based' : 'trait_based',
                scoring_criteria: {
                    primary_field: test.test_type === 'correct_answer' ? 'score' :
                                  test.test_type === 'value_based' ? 'total_value' : 'primary_trait',
                    secondary_field: 'time_taken_seconds',
                    secondary_order: 'asc'
                }
            });
        }

        // If submissionId provided, get full submission details
        let submissionData = null;
        if (submissionId) {
            submissionData = await TestSubmission.findById(submissionId);
        }

        // Check if user already exists in rankings
        const userIndex = leaderboard.rankings.findIndex(
            r => r.user.toString() === userId.toString()
        );

        // Prepare ranking entry with all data
        const rankingEntry = {
            user: userId,
            user_name: user.name || 'Unknown User',
            user_email: user.email || '',
            user_avatar: user.avatar || null,
            submission_id: submissionId || null,
            score: submissionData?.score || score || 0,
            max_score: submissionData?.max_score || 0,
            percentage: submissionData?.percentage || 0,
            correct_answers: submissionData?.correct_answers || 0,
            wrong_answers: submissionData?.wrong_answers || 0,
            total_value: submissionData?.total_value || 0,
            max_possible_value: submissionData?.max_possible_value || 0,
            value_percentage: submissionData?.value_percentage || 0,
            level: submissionData?.level || null,
            total_questions: submissionData?.total_questions || 0,
            answered_questions: submissionData?.answered_questions || 0,
            skipped_questions: submissionData?.skipped_questions || 0,
            passed: submissionData?.passed || false,
            time_taken_seconds: submissionData?.time_taken_seconds || 0,
            submitted_at: submissionData?.submitted_at || new Date(),
            trait_scores: submissionData?.trait_scores || new Map(),
            primary_trait: submissionData?.primary_trait || null,
            accuracy: submissionData?.accuracy || 0
        };

        // Update or add ranking
        if (userIndex !== -1) {
            // Store previous rank for tracking improvement
            rankingEntry.previous_rank = leaderboard.rankings[userIndex].rank;
            
            // Check if new score is better (for score-based tests)
            const shouldUpdate = shouldUpdateScore(
                leaderboard.rankings[userIndex],
                rankingEntry,
                test.test_type
            );

            if (shouldUpdate) {
                leaderboard.rankings[userIndex] = rankingEntry;
            } else {
                // Keep existing entry but update submission info if needed
                leaderboard.rankings[userIndex].submission_id = submissionId || leaderboard.rankings[userIndex].submission_id;
                leaderboard.rankings[userIndex].time_taken_seconds = rankingEntry.time_taken_seconds;
                leaderboard.rankings[userIndex].submitted_at = rankingEntry.submitted_at;
            }
        } else {
            leaderboard.rankings.push(rankingEntry);
        }

        // Recalculate ranks
        leaderboard.recalculateRanks();

        // Update best_score
        leaderboard.best_score = leaderboard.rankings.length > 0 ? 
            leaderboard.rankings[0].score : 0;

        // Update statistics
        await leaderboard.save();
        
        return leaderboard;

    } catch (err) {
        console.error("Error updating leaderboard:", err.message);
        throw err;
    }
};

// =============================================
// HELPER: Should Update Score
// =============================================
const shouldUpdateScore = (existingEntry, newEntry, testType) => {
    if (testType === 'correct_answer' || testType === 'pre-test' || testType === 'post-test') {
        // Update if new score is higher
        return newEntry.score > existingEntry.score;
    } else if (testType === 'value_based') {
        // Update if new total value is higher
        return newEntry.total_value > existingEntry.total_value;
    } else if (testType === 'assessment') {
        // For assessment tests, update if trait scores changed
        return true; // Always update assessment results
    }
    return false;
};

// =============================================
// GET LEADERBOARD WITH FILTERS
// =============================================
export const getLeaderboard = async (req, res) => {
    try {
        const { 
            testId, 
            subjectId, 
            lessonId, 
            limit = 50, 
            page = 1,
            only_passed,
            min_score,
            trait,
            level 
        } = req.query;

        const query = {};
        if (testId) query.test = testId;
        if (subjectId) query.subject = subjectId;
        if (lessonId) query.lesson = lessonId;

        const skip = (page - 1) * limit;

        let leaderboard = await Leaderboard.findOne(query)
            .populate({
                path: 'rankings.user',
                select: 'name email avatar'
            })
            .populate('test', 'test_name test_type')
            .populate('subject', 'title')
            .populate('lesson', 'name')
            .populate('created_by', 'name email');

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        // Apply filters
        let rankings = leaderboard.rankings;

        // Filter by passed
        if (only_passed === 'true') {
            rankings = rankings.filter(r => r.passed === true);
        }

        // Filter by min score
        if (min_score) {
            rankings = rankings.filter(r => r.score >= parseInt(min_score));
        }

        // Filter by trait (for assessment tests)
        if (trait) {
            rankings = rankings.filter(r => r.primary_trait === trait);
        }

        // Filter by level (for value-based tests)
        if (level) {
            rankings = rankings.filter(r => r.level === level);
        }

        // Paginate rankings
        const total = rankings.length;
        const paginatedRankings = rankings.slice(skip, skip + parseInt(limit));

        // Update leaderboard rankings with paginated data
        leaderboard.rankings = paginatedRankings;

        res.status(200).json({
            success: true,
            data: {
                ...leaderboard.toObject(),
                total_participants: total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                current_page_rankings: paginatedRankings.length
            }
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET LEADERBOARD FOR TEST
// =============================================
export const getLeaderboardForTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { limit = 20, page = 1 } = req.query;

        const skip = (page - 1) * limit;

        const leaderboard = await Leaderboard.findOne({ test: testId })
            .populate({
                path: 'rankings.user',
                select: 'name email avatar'
            })
            .populate('test', 'test_name test_type passing_percentage')
            .populate('subject', 'title')
            .populate('lesson', 'name')
            .populate('created_by', 'name email');

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found for this test"
            });
        }

        // Get total participants
        const total = leaderboard.rankings.length;

        // Paginate rankings
        const paginatedRankings = leaderboard.rankings.slice(skip, skip + parseInt(limit));

        // Get user's rank if authenticated
        let userRank = null;
        if (req.user) {
            userRank = leaderboard.getUserRank(req.user.id);
        }

        // Get statistics
        const statistics = {
            total_participants: total,
            average_score: leaderboard.statistics?.average_score || 0,
            average_percentage: leaderboard.statistics?.average_percentage || 0,
            highest_score: leaderboard.statistics?.highest_score || 0,
            lowest_score: leaderboard.statistics?.lowest_score || 0,
            pass_rate: leaderboard.statistics?.pass_rate || 0,
            average_time_minutes: (leaderboard.statistics?.average_time_seconds || 0) / 60,
            level_distribution: leaderboard.statistics?.level_distribution || {},
            trait_distribution: leaderboard.statistics?.trait_distribution || {}
        };

        // Get top 3 performers
        const topThree = leaderboard.getTopPerformers(3);

        res.status(200).json({
            success: true,
            data: {
                test_name: leaderboard.test_name,
                test_type: leaderboard.test_type,
                leaderboard_type: leaderboard.leaderboard_type,
                rankings: paginatedRankings,
                top_three: topThree,
                user_rank: userRank,
                statistics: statistics,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching leaderboard for test:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET USER RANK
// =============================================
export const getUserRank = async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const leaderboard = await Leaderboard.findOne({ test: testId })
            .populate({
                path: 'rankings.user',
                select: 'name email avatar'
            });

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        const userRank = leaderboard.getUserRank(userId);
        if (!userRank) {
            return res.status(404).json({
                success: false,
                message: "User not found in leaderboard"
            });
        }

        // Get user with neighbors
        const userWithNeighbors = leaderboard.getUserWithNeighbors(userId, 3);

        res.status(200).json({
            success: true,
            data: {
                rank: userRank,
                total_participants: leaderboard.rankings.length,
                user: leaderboard.rankings.find(r => r.user._id.toString() === userId.toString()),
                above: userWithNeighbors?.above || [],
                below: userWithNeighbors?.below || [],
                percentile: ((1 - (userRank - 1) / leaderboard.rankings.length) * 100).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching user rank:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET LEADERBOARD STATISTICS
// =============================================
export const getLeaderboardStatistics = async (req, res) => {
    try {
        const { testId } = req.params;

        const leaderboard = await Leaderboard.findOne({ test: testId });

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        const statistics = {
            total_participants: leaderboard.rankings.length,
            average_score: leaderboard.statistics?.average_score || 0,
            average_percentage: leaderboard.statistics?.average_percentage || 0,
            highest_score: leaderboard.statistics?.highest_score || 0,
            lowest_score: leaderboard.statistics?.lowest_score || 0,
            pass_rate: leaderboard.statistics?.pass_rate || 0,
            average_time_minutes: (leaderboard.statistics?.average_time_seconds || 0) / 60,
            
            // Test type specific statistics
            test_type: leaderboard.test_type,
            leaderboard_type: leaderboard.leaderboard_type,
            
            // For value-based tests
            level_distribution: leaderboard.statistics?.level_distribution || {},
            
            // For assessment tests
            trait_distribution: leaderboard.statistics?.trait_distribution || {},
            
            // Score distribution (buckets)
            score_distribution: getScoreDistribution(leaderboard.rankings),
            
            // Top performer info
            top_performer: leaderboard.rankings.length > 0 ? {
                user: leaderboard.rankings[0].user_name,
                score: leaderboard.rankings[0].score,
                percentage: leaderboard.rankings[0].percentage
            } : null,
            
            // Recent activity
            recent_activity: getRecentActivity(leaderboard.rankings)
        };

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error fetching leaderboard statistics:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// HELPER: Get Score Distribution
// =============================================
const getScoreDistribution = (rankings) => {
    const distribution = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
    };

    rankings.forEach(r => {
        const percentage = r.percentage || 0;
        if (percentage <= 20) distribution['0-20']++;
        else if (percentage <= 40) distribution['21-40']++;
        else if (percentage <= 60) distribution['41-60']++;
        else if (percentage <= 80) distribution['61-80']++;
        else distribution['81-100']++;
    });

    return distribution;
};

// =============================================
// HELPER: Get Recent Activity
// =============================================
const getRecentActivity = (rankings) => {
    const recent = rankings
        .filter(r => r.submitted_at)
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .slice(0, 10)
        .map(r => ({
            user: r.user_name,
            score: r.score,
            percentage: r.percentage,
            submitted_at: r.submitted_at,
            rank: r.rank
        }));

    return recent;
};

// =============================================
// GET TRAIT LEADERBOARD (For Assessment Tests)
// =============================================
export const getTraitLeaderboard = async (req, res) => {
    try {
        const { testId, trait } = req.params;
        const { limit = 20 } = req.query;

        const leaderboard = await Leaderboard.findOne({ test: testId });

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        if (leaderboard.test_type !== 'assessment') {
            return res.status(400).json({
                success: false,
                message: "This is not an assessment test"
            });
        }

        // Filter and sort by trait score
        const traitRankings = leaderboard.rankings
            .filter(r => r.trait_scores && r.trait_scores.has(trait))
            .map(r => ({
                ...r.toObject(),
                trait_score: r.trait_scores.get(trait).average
            }))
            .sort((a, b) => b.trait_score - a.trait_score)
            .slice(0, parseInt(limit))
            .map((r, index) => ({
                ...r,
                rank: index + 1
            }));

        res.status(200).json({
            success: true,
            data: {
                trait: trait,
                rankings: traitRankings,
                total_participants: traitRankings.length
            }
        });
    } catch (error) {
        console.error('Error fetching trait leaderboard:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET LEVEL LEADERBOARD (For Value-Based Tests)
// =============================================
export const getLevelLeaderboard = async (req, res) => {
    try {
        const { testId, level } = req.params;
        const { limit = 20 } = req.query;

        const leaderboard = await Leaderboard.findOne({ test: testId });

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        if (leaderboard.test_type !== 'value_based') {
            return res.status(400).json({
                success: false,
                message: "This is not a value-based test"
            });
        }

        // Filter by level
        const levelRankings = leaderboard.rankings
            .filter(r => r.level === level)
            .sort((a, b) => b.total_value - a.total_value)
            .slice(0, parseInt(limit))
            .map((r, index) => ({
                ...r.toObject(),
                rank: index + 1
            }));

        // Get level statistics
        const levelStats = leaderboard.getLevelStatistics(level);

        res.status(200).json({
            success: true,
            data: {
                level: level,
                rankings: levelRankings,
                statistics: levelStats,
                total_participants: levelRankings.length
            }
        });
    } catch (error) {
        console.error('Error fetching level leaderboard:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// GET LEADERBOARD HISTORY (Previous Ranks)
// =============================================
export const getLeaderboardHistory = async (req, res) => {
    try {
        const { testId, userId } = req.params;

        const leaderboard = await Leaderboard.findOne({ test: testId });

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        const userRanking = leaderboard.rankings.find(
            r => r.user.toString() === userId
        );

        if (!userRanking) {
            return res.status(404).json({
                success: false,
                message: "User not found in leaderboard"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                current_rank: userRanking.rank,
                previous_rank: userRanking.previous_rank || null,
                improvement: userRanking.previous_rank ? 
                    (userRanking.previous_rank - userRanking.rank) : null,
                score: userRanking.score,
                percentage: userRanking.percentage,
                total_participants: leaderboard.rankings.length,
                percentile: ((1 - (userRanking.rank - 1) / leaderboard.rankings.length) * 100).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching leaderboard history:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============================================
// RESET LEADERBOARD
// =============================================
export const resetLeaderboard = async (req, res) => {
    try {
        const { testId } = req.params;

        const leaderboard = await Leaderboard.findOne({ test: testId });

        if (!leaderboard) {
            return res.status(404).json({
                success: false,
                message: "Leaderboard not found"
            });
        }

        // Clear rankings but keep the document
        leaderboard.rankings = [];
        leaderboard.best_score = 0;
        leaderboard.statistics = {
            total_participants: 0,
            average_score: 0,
            average_percentage: 0,
            highest_score: 0,
            lowest_score: 0,
            pass_rate: 0,
            average_time_seconds: 0,
            level_distribution: new Map(),
            trait_distribution: new Map()
        };
        leaderboard.last_updated = new Date();

        await leaderboard.save();

        res.status(200).json({
            success: true,
            message: "Leaderboard reset successfully"
        });
    } catch (error) {
        console.error('Error resetting leaderboard:', error.message);
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
    updateLeaderboard,
    getLeaderboard,
    getLeaderboardForTest,
    getUserRank,
    getLeaderboardStatistics,
    getTraitLeaderboard,
    getLevelLeaderboard,
    getLeaderboardHistory,
    resetLeaderboard
};