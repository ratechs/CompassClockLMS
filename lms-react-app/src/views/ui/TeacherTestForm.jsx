// TestFormReact.jsx
import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updateTest, useCreateTests } from "../../hooks/Tests/useCreateTest";
import { useCourse } from "../../hooks/Courses/useCourses";
import { useAuthcontext } from "../../contexts/Authcontext";
import { useParams } from "react-router-dom";
import { useGetTests } from "../../hooks/Tests/getTest";
import "./TestForm.css";

const TestFormReact = () => {
  const [activeTab, setActiveTab] = useState("details");
  const { id } = useParams();
  const { tests } = useGetTests({ id });
  const { authUser } = useAuthcontext();
  const user = authUser?.user || null;

  // Default question based on test type
  const defaultQuestion = useCallback((testType = "correct_answer") => {
    const isAssessment = testType === "assessment";
    const isValueBased = testType === "value_based";
    const isCorrectAnswer = testType === "correct_answer" || testType === "pre-test" || testType === "post-test";
    
    return {
      question_type: "MCQ",
      question_text: "",
      question_options: [
        { text: "", value: isValueBased ? 0 : null },
        { text: "", value: isValueBased ? 0 : null },
        { text: "", value: isValueBased ? 0 : null },
        { text: "", value: isValueBased ? 0 : null }
      ],
      correct_options: [],
      correct_option_text: "",
      positive_mark: isCorrectAnswer ? 1 : 0,
      negative_mark: 0,
      solution: "",
      test_category: isAssessment ? "assessment" : 
                     isValueBased ? "value_based" : "correct_answer",
      question_category: "general",
      trait_mapping: null,
      max_value: 0
    };
  }, []);

  const [testForm, setTestForm] = useState({
    test_name: "",
    test_type: "pre-test",
    test_subject: "",
    test_lesson: "",
    test_questions: [defaultQuestion("pre-test")],
    created_by: user,
    passing_percentage: 40,
    time_limit_minutes: null,
    value_scoring_config: {
      method: "sum",
      score_ranges: [
        { min_score: 0, max_score: 33, level: "Beginner", description: "", recommendations: [] },
        { min_score: 34, max_score: 66, level: "Intermediate", description: "", recommendations: [] },
        { min_score: 67, max_score: 100, level: "Advanced", description: "", recommendations: [] }
      ]
    },
    assessment_guidelines: {
      instructions: "",
      traits: [],
      disclaimer: ""
    }
  });

  const { createTest } = useCreateTests();
  const { course } = useCourse();
  const [subject, setSubject] = useState([]);

  useEffect(() => {
    if (tests?.data && !testForm.test_name) {
      const loadedSubjectId = tests.data.test_subject?._id;
      const loadedLessonId = tests.data.test_lesson?._id;
      const selectedCourse = course.find(
        (c) => String(c._id) === String(loadedSubjectId)
      );

      setTestForm({
        test_name: tests.data.test_name || "",
        test_type: tests.data.test_type || "pre-test",
        test_subject: loadedSubjectId || "",
        test_lesson: tests.data.test_lesson?._id || "",
        test_questions: tests.data.test_questions || [defaultQuestion(tests.data.test_type)],
        created_by: user,
        passing_percentage: tests.data.passing_percentage || 40,
        time_limit_minutes: tests.data.time_limit_minutes || null,
        value_scoring_config: tests.data.value_scoring_config || {
          method: "sum",
          score_ranges: [
            { min_score: 0, max_score: 33, level: "Beginner", description: "", recommendations: [] },
            { min_score: 34, max_score: 66, level: "Intermediate", description: "", recommendations: [] },
            { min_score: 67, max_score: 100, level: "Advanced", description: "", recommendations: [] }
          ]
        },
        assessment_guidelines: tests.data.assessment_guidelines || {
          instructions: "",
          traits: [],
          disclaimer: ""
        }
      });

      if (selectedCourse && selectedCourse.subjects) {
        setSubject(selectedCourse.subjects);
      }
    }
  }, [tests, course, user, testForm.test_name, defaultQuestion]);

  const handleInputChange = (field, value) => {
    if (field === "test_subject") {
      const selectedSubject = course.find((sub) => sub._id === value);
      setSubject(selectedSubject ? selectedSubject.subjects : []);
    }
    setTestForm({ ...testForm, [field]: value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...testForm.test_questions];
    updatedQuestions[index][field] = value;
    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...testForm.test_questions];
    updatedQuestions[qIndex].question_options[oIndex].text = value;
    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  const handleOptionValueChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...testForm.test_questions];
    updatedQuestions[qIndex].question_options[oIndex].value = parseInt(value) || 0;
    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  const addQuestion = () => {
    setTestForm((prev) => ({
      ...prev,
      test_questions: [...prev.test_questions, defaultQuestion(prev.test_type)],
    }));
  };

  const removeQuestion = (index) => {
    const updatedQuestions = testForm.test_questions.filter(
      (_, i) => i !== index
    );
    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  const addOption = (index) => {
    const updatedQuestions = [...testForm.test_questions];
    if (updatedQuestions[index].question_options.length < 6) {
      const isValueBased = testForm.test_type === "value_based";
      updatedQuestions[index].question_options.push({ 
        text: "", 
        value: isValueBased ? 0 : null 
      });
    }
    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  const removeOption = (qIndex, oIndex) => {
    const updatedQuestions = [...testForm.test_questions];
    updatedQuestions[qIndex].question_options.splice(oIndex, 1);

    if (updatedQuestions[qIndex].question_options.length < 2) {
      const isValueBased = testForm.test_type === "value_based";
      updatedQuestions[qIndex].question_options.push({ 
        text: "", 
        value: isValueBased ? 0 : null 
      });
    }

    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  const updateCorrectOptionText = (qIndex, oIndex) => {
    const question = testForm.test_questions[qIndex];
    const selectedOption = String.fromCharCode(65 + oIndex);
    const optionText = question.question_options[oIndex].text;

    const updatedQuestions = [...testForm.test_questions];
    updatedQuestions[qIndex].correct_options = [selectedOption];
    updatedQuestions[qIndex].correct_option_text = optionText;

    setTestForm({ ...testForm, test_questions: updatedQuestions });
  };

  // Get test category label
  const getTestCategoryLabel = (type) => {
    const labels = {
      'pre-test': 'Pre-Test',
      'post-test': 'Post-Test',
      'correct_answer': 'Correct Answer Test',
      'assessment': 'Assessment Test',
      'value_based': 'Value-Based Test'
    };
    return labels[type] || type;
  };

  // Get tabs based on test type
  const getTabs = () => {
    const tabs = ["details"];
    
    if (testForm.test_type === "assessment") {
      tabs.push("assessment_config");
    } else if (testForm.test_type === "value_based") {
      tabs.push("value_config");
    }
    
    tabs.push("questions");
    tabs.push("solutions");
    return tabs;
  };

  // Check if test type requires correct answers
  const requiresCorrectAnswers = () => {
    return ['pre-test', 'post-test', 'correct_answer'].includes(testForm.test_type);
  };

  // Check if test type is assessment
  const isAssessment = () => {
    return testForm.test_type === 'assessment';
  };

  // Check if test type is value-based
  const isValueBased = () => {
    return testForm.test_type === 'value_based';
  };

  const nextTab = () => {
    if (activeTab === "details") {
      if (isAssessment()) {
        setActiveTab("assessment_config");
      } else if (isValueBased()) {
        setActiveTab("value_config");
      } else {
        setActiveTab("questions");
      }
    } else if (activeTab === "assessment_config" || activeTab === "value_config") {
      setActiveTab("questions");
    } else if (activeTab === "questions") {
      setActiveTab("solutions");
    }
  };

  const prevTab = () => {
    if (activeTab === "solutions") {
      setActiveTab("questions");
    } else if (activeTab === "questions") {
      if (isAssessment()) {
        setActiveTab("assessment_config");
      } else if (isValueBased()) {
        setActiveTab("value_config");
      } else {
        setActiveTab("details");
      }
    } else if (activeTab === "assessment_config" || activeTab === "value_config") {
      setActiveTab("details");
    }
  };

  const saveTest = async () => {
    try {
      // Validate based on test type
      if (requiresCorrectAnswers()) {
        for (const q of testForm.test_questions) {
          if (!q.correct_options || q.correct_options.length === 0) {
            toast.error(`Question "${q.question_text}" must have a correct answer`);
            return;
          }
        }
      }

      if (isValueBased()) {
        for (const q of testForm.test_questions) {
          for (const opt of q.question_options) {
            if (opt.value === null || opt.value === undefined) {
              toast.error(`All options in question "${q.question_text}" must have values`);
              return;
            }
          }
        }
      }

      const payload = {
        ...testForm,
        test_questions: testForm.test_questions.map((q) => {
          const isCorrectAnswer = requiresCorrectAnswers();
          const isAssessmentType = isAssessment();
          const isValueBasedType = isValueBased();

          const questionData = {
            ...q,
            test_category: isAssessmentType ? "assessment" :
                          isValueBasedType ? "value_based" : "correct_answer"
          };

          // For assessment tests, remove correct options and marks
          if (isAssessmentType) {
            questionData.correct_options = [];
            questionData.correct_option_text = "";
            questionData.positive_mark = 0;
            questionData.negative_mark = 0;
          }

          // For value-based tests, remove correct options
          if (isValueBasedType) {
            questionData.correct_options = [];
            questionData.correct_option_text = "";
          }

          return questionData;
        }),
      };

      if (!id) {
        await createTest(payload);
        toast.success("Test created successfully!");
      } else {
        await updateTest(id, payload);
        toast.success("Test updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save test");
    }
  };

  const tabs = getTabs();

  // Get test type description
  const getTestTypeDescription = (type) => {
    const descriptions = {
      'pre-test': 'Pre-tests are taken before a course/lesson to assess prior knowledge. They have correct answers and are graded.',
      'post-test': 'Post-tests are taken after a course/lesson to measure learning outcomes. They have correct answers and are graded.',
      'correct_answer': 'Standard multiple choice tests with correct answers and grading.',
      'assessment': 'Assessment tests have no correct answers. Users select options based on their preferences/opinions. Results show trait profiles.',
      'value_based': 'Value-based tests have options with numerical values. Results are calculated based on the sum of selected values.'
    };
    return descriptions[type] || '';
  };

  return (
    <div className="test-form-container">
      <h1 className="test-form-heading">{id ? "Edit Test" : "Create New Test"}</h1>

      <div className="test-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "active" : ""}
          >
            {tab
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* ===== DETAILS TAB ===== */}
      {activeTab === "details" && (
        <form
          className="test-form"
          onSubmit={(e) => {
            e.preventDefault();
            nextTab();
          }}
        >
          <div className="form-group">
            <label className="form-label">Test Name *</label>
            <input
              type="text"
              className="form-input"
              value={testForm.test_name}
              onChange={(e) => handleInputChange("test_name", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Test Type *</label>
            <select
              className="form-select"
              value={testForm.test_type}
              onChange={(e) => {
                const newType = e.target.value;
                setTestForm({
                  ...testForm,
                  test_type: newType,
                  test_questions: [defaultQuestion(newType)]
                });
              }}
              required
            >
              <option value="pre-test">Pre-Test (Before Course/Lesson)</option>
              <option value="post-test">Post-Test (After Course/Lesson)</option>
              <option value="correct_answer">Correct Answer Test</option>
              <option value="assessment">Assessment Test (No Correct Answer)</option>
              <option value="value_based">Value-Based Test (Options Have Values)</option>
            </select>
            <small className="form-help-text">
              {getTestTypeDescription(testForm.test_type)}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <select
              className="form-select"
              value={testForm.test_subject}
              onChange={(e) =>
                handleInputChange("test_subject", e.target.value)
              }
              required
            >
              <option value="">Select Subject</option>
              {course.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Lesson *</label>
            <select
              className="form-select"
              value={testForm.test_lesson}
              onChange={(e) => handleInputChange("test_lesson", e.target.value)}
              required
            >
              <option value="">Select Lesson</option>
              {subject.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {requiresCorrectAnswers() && (
            <div className="form-group">
              <label className="form-label">Passing Percentage (%)</label>
              <input
                type="number"
                className="form-input"
                value={testForm.passing_percentage}
                onChange={(e) => handleInputChange("passing_percentage", parseInt(e.target.value))}
                min="0"
                max="100"
              />
              <small className="form-help-text">Minimum percentage required to pass the test</small>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Time Limit (Minutes)</label>
            <input
              type="number"
              className="form-input"
              value={testForm.time_limit_minutes || ""}
              onChange={(e) => handleInputChange("time_limit_minutes", parseInt(e.target.value) || null)}
              min="1"
              placeholder="Optional - Leave blank for no time limit"
            />
          </div>

          <div className="button-container">
            <button type="submit" className="test-button test-button-primary">
              Next →
            </button>
          </div>
        </form>
      )}

      {/* ===== ASSESSMENT CONFIG TAB ===== */}
      {activeTab === "assessment_config" && (
        <form
          className="test-form"
          onSubmit={(e) => {
            e.preventDefault();
            nextTab();
          }}
        >
          <div className="config-header">
            <h3>Assessment Configuration</h3>
            <p className="text-muted">Configure traits and guidelines for this assessment test</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Instructions</label>
            <ReactQuill
              value={testForm.assessment_guidelines?.instructions || ""}
              onChange={(content) => {
                setTestForm({
                  ...testForm,
                  assessment_guidelines: {
                    ...testForm.assessment_guidelines,
                    instructions: content
                  }
                });
              }}
              placeholder="Enter instructions for the assessment..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Trait Categories</label>
            <p className="text-muted">Define traits that will be measured in this assessment</p>
            {testForm.assessment_guidelines?.traits?.map((trait, index) => (
              <div key={index} className="trait-item">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Trait Name (e.g., Visual, Auditory)"
                  value={trait.name || ""}
                  onChange={(e) => {
                    const updatedTraits = [...testForm.assessment_guidelines.traits];
                    updatedTraits[index].name = e.target.value;
                    setTestForm({
                      ...testForm,
                      assessment_guidelines: {
                        ...testForm.assessment_guidelines,
                        traits: updatedTraits
                      }
                    });
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Description"
                  value={trait.description || ""}
                  onChange={(e) => {
                    const updatedTraits = [...testForm.assessment_guidelines.traits];
                    updatedTraits[index].description = e.target.value;
                    setTestForm({
                      ...testForm,
                      assessment_guidelines: {
                        ...testForm.assessment_guidelines,
                        traits: updatedTraits
                      }
                    });
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Interpretation"
                  value={trait.interpretation || ""}
                  onChange={(e) => {
                    const updatedTraits = [...testForm.assessment_guidelines.traits];
                    updatedTraits[index].interpretation = e.target.value;
                    setTestForm({
                      ...testForm,
                      assessment_guidelines: {
                        ...testForm.assessment_guidelines,
                        traits: updatedTraits
                      }
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedTraits = testForm.assessment_guidelines.traits.filter(
                      (_, i) => i !== index
                    );
                    setTestForm({
                      ...testForm,
                      assessment_guidelines: {
                        ...testForm.assessment_guidelines,
                        traits: updatedTraits
                      }
                    });
                  }}
                  className="test-button-danger test-button"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setTestForm({
                  ...testForm,
                  assessment_guidelines: {
                    ...testForm.assessment_guidelines,
                    traits: [...(testForm.assessment_guidelines?.traits || []), { name: "", description: "", interpretation: "" }]
                  }
                });
              }}
              className="test-button-secondary test-button"
            >
              + Add Trait
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Disclaimer</label>
            <input
              type="text"
              className="form-input"
              value={testForm.assessment_guidelines?.disclaimer || ""}
              onChange={(e) => {
                setTestForm({
                  ...testForm,
                  assessment_guidelines: {
                    ...testForm.assessment_guidelines,
                    disclaimer: e.target.value
                  }
                });
              }}
              placeholder="e.g., This is a self-assessment for personal development"
            />
          </div>

          <div className="button-container">
            <button
              type="button"
              onClick={prevTab}
              className="test-button-secondary test-button"
            >
              ← Previous
            </button>
            <button type="submit" className="test-button-primary test-button">
              Next →
            </button>
          </div>
        </form>
      )}

      {/* ===== VALUE CONFIG TAB ===== */}
      {activeTab === "value_config" && (
        <form
          className="test-form"
          onSubmit={(e) => {
            e.preventDefault();
            nextTab();
          }}
        >
          <div className="config-header">
            <h3>Value-Based Scoring Configuration</h3>
            <p className="text-muted">Configure how scores will be calculated for this value-based test</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Scoring Method</label>
            <select
              className="form-select"
              value={testForm.value_scoring_config?.method || "sum"}
              onChange={(e) => {
                setTestForm({
                  ...testForm,
                  value_scoring_config: {
                    ...testForm.value_scoring_config,
                    method: e.target.value
                  }
                });
              }}
            >
              <option value="sum">Sum of Values</option>
              <option value="average">Average of Values</option>
              <option value="percentage">Percentage</option>
            </select>
            <small className="form-help-text">
              {testForm.value_scoring_config?.method === "sum" && "Total score is the sum of all selected option values"}
              {testForm.value_scoring_config?.method === "average" && "Total score is the average of all selected option values"}
              {testForm.value_scoring_config?.method === "percentage" && "Total score is calculated as a percentage of maximum possible value"}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Score Ranges (for Level Assignment)</label>
            <p className="text-muted">Define ranges to assign levels based on percentage scores</p>
            {testForm.value_scoring_config?.score_ranges?.map((range, index) => (
              <div key={index} className="score-range-item">
                <input
                  type="number"
                  className="form-input"
                  placeholder="Min Score"
                  value={range.min_score}
                  onChange={(e) => {
                    const updatedRanges = [...testForm.value_scoring_config.score_ranges];
                    updatedRanges[index].min_score = parseInt(e.target.value) || 0;
                    setTestForm({
                      ...testForm,
                      value_scoring_config: {
                        ...testForm.value_scoring_config,
                        score_ranges: updatedRanges
                      }
                    });
                  }}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Max Score"
                  value={range.max_score}
                  onChange={(e) => {
                    const updatedRanges = [...testForm.value_scoring_config.score_ranges];
                    updatedRanges[index].max_score = parseInt(e.target.value) || 0;
                    setTestForm({
                      ...testForm,
                      value_scoring_config: {
                        ...testForm.value_scoring_config,
                        score_ranges: updatedRanges
                      }
                    });
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Level (e.g., Beginner)"
                  value={range.level || ""}
                  onChange={(e) => {
                    const updatedRanges = [...testForm.value_scoring_config.score_ranges];
                    updatedRanges[index].level = e.target.value;
                    setTestForm({
                      ...testForm,
                      value_scoring_config: {
                        ...testForm.value_scoring_config,
                        score_ranges: updatedRanges
                      }
                    });
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Description"
                  value={range.description || ""}
                  onChange={(e) => {
                    const updatedRanges = [...testForm.value_scoring_config.score_ranges];
                    updatedRanges[index].description = e.target.value;
                    setTestForm({
                      ...testForm,
                      value_scoring_config: {
                        ...testForm.value_scoring_config,
                        score_ranges: updatedRanges
                      }
                    });
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedRanges = testForm.value_scoring_config.score_ranges.filter(
                      (_, i) => i !== index
                    );
                    setTestForm({
                      ...testForm,
                      value_scoring_config: {
                        ...testForm.value_scoring_config,
                        score_ranges: updatedRanges
                      }
                    });
                  }}
                  className="test-button-danger test-button"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setTestForm({
                  ...testForm,
                  value_scoring_config: {
                    ...testForm.value_scoring_config,
                    score_ranges: [
                      ...(testForm.value_scoring_config?.score_ranges || []),
                      { min_score: 0, max_score: 0, level: "", description: "", recommendations: [] }
                    ]
                  }
                });
              }}
              className="test-button-secondary test-button"
            >
              + Add Score Range
            </button>
          </div>

          <div className="button-container">
            <button
              type="button"
              onClick={prevTab}
              className="test-button-secondary test-button"
            >
              ← Previous
            </button>
            <button type="submit" className="test-button-primary test-button">
              Next →
            </button>
          </div>
        </form>
      )}

      {/* ===== QUESTIONS TAB ===== */}
      {(activeTab === "questions") && (
        <form
          className="test-form"
          onSubmit={(e) => {
            e.preventDefault();
            nextTab();
          }}
        >
          <div className="questions-header">
            <h3>Questions ({testForm.test_questions.length})</h3>
            <div className="questions-actions">
              <span className="test-type-badge">{getTestCategoryLabel(testForm.test_type)}</span>
              <button
                type="button"
                onClick={addQuestion}
                className="test-button-secondary test-button"
              >
                + Add Question
              </button>
            </div>
          </div>

          {testForm.test_questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h4>Question {qIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="test-button-danger test-button"
                >
                  Remove
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <ReactQuill
                  value={question.question_text}
                  onChange={(content) =>
                    handleQuestionChange(qIndex, "question_text", content)
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Question Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={question.question_category || "general"}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "question_category", e.target.value)
                  }
                  placeholder="e.g., Math, Science, General"
                />
              </div>

              {isAssessment() && (
                <div className="form-group">
                  <label className="form-label">Trait Mapping</label>
                  <select
                    className="form-select"
                    value={question.trait_mapping || ""}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, "trait_mapping", e.target.value)
                    }
                  >
                    <option value="">Select Trait</option>
                    {testForm.assessment_guidelines?.traits?.map((trait, idx) => (
                      <option key={idx} value={trait.name}>
                        {trait.name}
                      </option>
                    ))}
                  </select>
                  <small className="form-help-text">Map this question to a trait for assessment scoring</small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Options</label>
                <div className="options-grid">
                  {question.question_options.map((option, oIndex) => (
                    <div key={oIndex} className="option-item">
                      <div className="option-input-group">
                        <span className="option-label">{String.fromCharCode(65 + oIndex)}</span>
                        <ReactQuill
                          value={option.text}
                          onChange={(content) =>
                            handleOptionChange(qIndex, oIndex, content)
                          }
                        />
                        
                        {isValueBased() && (
                          <input
                            type="number"
                            className="form-input option-value-input"
                            placeholder="Value"
                            value={option.value || 0}
                            onChange={(e) =>
                              handleOptionValueChange(qIndex, oIndex, e.target.value)
                            }
                            min="0"
                            step="1"
                          />
                        )}

                        {requiresCorrectAnswers() && (
                          <div className="correct-option-selector">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correct_options.includes(
                                String.fromCharCode(65 + oIndex)
                              )}
                              onChange={() => updateCorrectOptionText(qIndex, oIndex)}
                            />
                            <label>✓</label>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="test-button-danger test-button"
                          disabled={question.question_options.length <= 2}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="test-button-secondary test-button"
                  disabled={question.question_options.length >= 6}
                >
                  + Add Option
                </button>
              </div>

              {requiresCorrectAnswers() && (
                <>
                  <div className="form-group">
                    <label className="form-label">Correct Answer</label>
                    <input
                      type="text"
                      className="form-input correct-answer-display"
                      value={question.correct_option_text || "No correct option selected"}
                      disabled
                    />
                  </div>

                  <div className="marks-row">
                    <div className="form-group">
                      <label className="form-label">Positive Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={question.positive_mark || 0}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "positive_mark",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Negative Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={question.negative_mark || 0}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "negative_mark",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Solution/Explanation</label>
                <ReactQuill
                  value={question.solution || ""}
                  onChange={(content) =>
                    handleQuestionChange(qIndex, "solution", content)
                  }
                />
              </div>
            </div>
          ))}

          <div className="button-container">
            <button
              type="button"
              onClick={prevTab}
              className="test-button-secondary test-button"
            >
              ← Previous
            </button>
            <button
              type="submit"
              className="test-button-primary test-button"
              disabled={testForm.test_questions.length === 0}
            >
              Next →
            </button>
          </div>
        </form>
      )}

      {/* ===== SOLUTIONS TAB ===== */}
      {activeTab === "solutions" && (
        <form
          className="test-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveTest();
          }}
        >
          <div className="config-header">
            <h3>Review & Submit</h3>
            <p className="text-muted">Review all questions and their solutions before submitting</p>
          </div>

          <div className="test-summary">
            <div className="summary-item">
              <strong>Test Name:</strong> {testForm.test_name}
            </div>
            <div className="summary-item">
              <strong>Test Type:</strong> {getTestCategoryLabel(testForm.test_type)}
            </div>
            <div className="summary-item">
              <strong>Total Questions:</strong> {testForm.test_questions.length}
            </div>
          </div>
          
          {testForm.test_questions.map((question, index) => (
            <div key={index} className="question-solution-form-item">
              <h4>Solution for Question {index + 1}</h4>
              <div className="question-preview">
                <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
              </div>
              <div className="form-group">
                <label className="form-label">Solution/Explanation</label>
                <ReactQuill
                  value={question.solution || ""}
                  onChange={(content) =>
                    handleQuestionChange(index, "solution", content)
                  }
                />
              </div>
            </div>
          ))}

          <div className="button-container">
            <button
              type="button"
              onClick={prevTab}
              className="test-button-secondary test-button"
            >
              ← Previous
            </button>
            <button type="submit" className="test-button-primary test-button">
              {id ? "Update Test" : "Create Test"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TestFormReact;