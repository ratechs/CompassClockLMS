// hooks/Psychometric/usePsychometric.js
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ================================================================
// START TEST
// ================================================================

export const useStartPsychometricTest = () => {
    const [loading, setLoading] = useState(false);

    const startTest = async (studentId, deviceInfo = {}) => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    student_id: studentId, 
                    device_info: deviceInfo 
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to start test');
            }

            return data;
        } catch (error) {
            console.error('Error starting test:', error);
            toast.error(error.message || 'Failed to start test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { startTest, loading };
};

// ================================================================
// GET SECTION QUESTIONS
// ================================================================

export const useGetSectionQuestions = () => {
    const [loading, setLoading] = useState(false);

    const getQuestions = async (section) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/questions/${section}`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch questions');
            }

            return data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error(error.message || 'Failed to fetch questions');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getQuestions, loading };
};

// ================================================================
// SAVE SECTION RESPONSE
// ================================================================

export const useSaveSectionResponse = () => {
    const [loading, setLoading] = useState(false);

    const saveSection = async (testId, section, responses, timeSpent = 0) => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/save-section', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    test_id: testId,
                    section,
                    responses,
                    time_spent_seconds: timeSpent
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to save section');
            }

            toast.success('Section saved successfully!');
            return data;
        } catch (error) {
            console.error('Error saving section:', error);
            toast.error(error.message || 'Failed to save section');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { saveSection, loading };
};

// ================================================================
// GET TEST STATUS
// ================================================================

export const useGetTestStatus = () => {
    const [loading, setLoading] = useState(false);

    const getStatus = async (studentId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/status/${studentId}`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch test status');
            }

            return data;
        } catch (error) {
            console.error('Error fetching test status:', error);
            toast.error(error.message || 'Failed to fetch test status');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getStatus, loading };
};

// ================================================================
// GET SECTION DATA
// ================================================================

export const useGetSectionData = () => {
    const [loading, setLoading] = useState(false);

    const getSectionData = async (testId, section) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/section/${testId}/${section}`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch section data');
            }

            return data;
        } catch (error) {
            console.error('Error fetching section data:', error);
            toast.error(error.message || 'Failed to fetch section data');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getSectionData, loading };
};

// ================================================================
// GET STUDENT TESTS
// ================================================================

export const useGetStudentTests = () => {
    const [loading, setLoading] = useState(false);

    const getStudentTests = async (studentId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/student/${studentId}/all`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch student tests');
            }

            return data;
        } catch (error) {
            console.error('Error fetching student tests:', error);
            toast.error(error.message || 'Failed to fetch student tests');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getStudentTests, loading };
};

// ================================================================
// PAUSE TEST
// ================================================================

export const usePauseTest = () => {
    const [loading, setLoading] = useState(false);

    const pauseTest = async (testId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/pause/${testId}`, {
                method: 'PATCH',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to pause test');
            }

            toast.success('Test paused successfully!');
            return data;
        } catch (error) {
            console.error('Error pausing test:', error);
            toast.error(error.message || 'Failed to pause test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { pauseTest, loading };
};

// ================================================================
// RESUME TEST
// ================================================================

export const useResumeTest = () => {
    const [loading, setLoading] = useState(false);

    const resumeTest = async (testId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/resume/${testId}`, {
                method: 'PATCH',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to resume test');
            }

            toast.success('Test resumed successfully!');
            return data;
        } catch (error) {
            console.error('Error resuming test:', error);
            toast.error(error.message || 'Failed to resume test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { resumeTest, loading };
};

// ================================================================
// GET TEST RESULTS
// ================================================================

export const useGetTestResults = () => {
    const [loading, setLoading] = useState(false);

    const getResults = async (testId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/results/${testId}`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch test results');
            }

            return data;
        } catch (error) {
            console.error('Error fetching test results:', error);
            toast.error(error.message || 'Failed to fetch test results');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getResults, loading };
};

// ================================================================
// ADMIN: GET ALL TESTS
// ================================================================

export const useAdminGetAllTests = () => {
    const [loading, setLoading] = useState(false);

    const getAllTests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/admin/all', {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch all tests');
            }

            return data;
        } catch (error) {
            console.error('Error fetching all tests:', error);
            toast.error(error.message || 'Failed to fetch all tests');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getAllTests, loading };
};

// ================================================================
// ADMIN: GET STATS
// ================================================================

export const useAdminGetStats = () => {
    const [loading, setLoading] = useState(false);

    const getStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/admin/stats', {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch stats');
            }

            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error(error.message || 'Failed to fetch stats');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getStats, loading };
};

// ================================================================
// ADMIN: CREATE PSYCHOMETRIC TEST
// ================================================================

export const useAdminCreatePsychometricTest = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const createTest = async (testData) => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/admin/create-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(testData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create test');
            }

            toast.success('Psychometric test created successfully!');
            navigate('/instructor/test');
            return data;
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error(error.message || 'Failed to create test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { createTest, loading };
};

// ================================================================
// ADMIN: GET ALL PSYCHOMETRIC TESTS
// ================================================================

export const useAdminGetAllPsychometricTests = () => {
    const [loading, setLoading] = useState(false);

    const getAllTests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/admin/tests', {
                credentials: 'include',
            });

            const data = await res.json();
            console.log(data);

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch psychometric tests');
            }

            return data;
        } catch (error) {
            console.error('Error fetching psychometric tests:', error);
            toast.error(error.message || 'Failed to fetch tests');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getAllTests, loading };
};

// ================================================================
// ADMIN: GET SINGLE PSYCHOMETRIC TEST
// ================================================================

export const useAdminGetPsychometricTest = () => {
    const [loading, setLoading] = useState(false);

    const getTest = async (testId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/admin/test/${testId}`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch psychometric test');
            }

            return data;
        } catch (error) {
            console.error('Error fetching psychometric test:', error);
            toast.error(error.message || 'Failed to fetch test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { getTest, loading };
};

// ================================================================
// ADMIN: UPDATE PSYCHOMETRIC TEST
// ================================================================

export const useAdminUpdatePsychometricTest = () => {
    const [loading, setLoading] = useState(false);

    const updateTest = async (testId, testData) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/admin/test/${testId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(testData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update psychometric test');
            }

            toast.success('Psychometric test updated successfully!');
            return data;
        } catch (error) {
            console.error('Error updating psychometric test:', error);
            toast.error(error.message || 'Failed to update test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { updateTest, loading };
};

// ================================================================
// ADMIN: DELETE PSYCHOMETRIC TEST
// ================================================================

export const useAdminDeletePsychometricTest = () => {
    const [loading, setLoading] = useState(false);

    const deleteTest = async (testId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pyschometricTest/admin/test/${testId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to delete psychometric test');
            }

            toast.success('Psychometric test deleted successfully!');
            return data;
        } catch (error) {
            console.error('Error deleting psychometric test:', error);
            toast.error(error.message || 'Failed to delete test');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { deleteTest, loading };
};

// ================================================================
// ADMIN: GENERATE AI QUESTIONS
// ================================================================

export const useAdminGenerateAIQuestions = () => {
    const [loading, setLoading] = useState(false);

    const generateQuestions = async (params) => {
        setLoading(true);
        try {
            const res = await fetch('/api/pyschometricTest/admin/generate-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(params)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate questions');
            }

            toast.success('Questions generated successfully!');
            return data;
        } catch (error) {
            console.error('Error generating questions:', error);
            toast.error(error.message || 'Failed to generate questions');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { generateQuestions, loading };
};

// ================================================================
// EXPORT ALL
// ================================================================

export default {
    // Student Hooks
    useStartPsychometricTest,
    useGetSectionQuestions,
    useSaveSectionResponse,
    useGetTestStatus,
    useGetSectionData,
    useGetStudentTests,
    usePauseTest,
    useResumeTest,
    useGetTestResults,

    // Admin Hooks
    useAdminGetAllTests,
    useAdminGetStats,
    useAdminCreatePsychometricTest,
    useAdminGetAllPsychometricTests,
    useAdminGetPsychometricTest,
    useAdminUpdatePsychometricTest,
    useAdminDeletePsychometricTest,
    useAdminGenerateAIQuestions,
};