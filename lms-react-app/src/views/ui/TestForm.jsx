import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updateTest, useCreateTests } from "../../hooks/Tests/useCreateTest";
import { useCourse } from "../../hooks/Courses/useCourses";
import { useAuthcontext } from "../../contexts/Authcontext";
import { useParams, useNavigate } from "react-router-dom";
import { useGetTests } from "../../hooks/Tests/getTest";

const TestFormReact = () => {
  const [activeTab, setActiveTab] = useState("details");
  const { id } = useParams();
  const navigate = useNavigate();
  const { tests, loading: testLoading } = useGetTests({ id });
  const { authUser } = useAuthcontext();
  const user = authUser?.user || null;
  const { course, loading: courseLoading } = useCourse();
  const [subjects, setSubjects] = useState([]);
  const { createTest } = useCreateTests();
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("the given id is: ", id)
  // Default question based on test type
  const defaultQuestion = useCallback((testType = "correct_answer") => {
    const isAssessment = testType === "assessment";
    const isValueBased = testType === "value_based";
    const isCorrectAnswer = ["correct_answer", "pre-test", "post-test"].includes(testType);
    
    return {
      question_type: "single_choice",
      question_text: "",
      options: [
        { option_text: "", option_value: isValueBased ? 0 : null, option_trait: null },
        { option_text: "", option_value: isValueBased ? 0 : null, option_trait: null },
        { option_text: "", option_value: isValueBased ? 0 : null, option_trait: null },
        { option_text: "", option_value: isValueBased ? 0 : null, option_trait: null }
      ],
      correct_options: [],
      correct_option_text: "",
      positive_mark: isCorrectAnswer ? 1 : 0,
      negative_mark: 0,
      explanation: "",
      question_category: "general",
      max_value: 0,
      difficulty_level: "medium",
      time_allocated_seconds: 60
    };
  }, []);

  const [testForm, setTestForm] = useState({
    title: "",
    description: "",
    test_type: "pre-test",
    category: "",
    sub_category: "",
    questions: [defaultQuestion("pre-test")],
    created_by: user?._id,
    settings: {
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
    },
    assessment_config: {
      traits: [],
      default_interpretations: []
    },
    value_config: {
      ranges: [
        { min_value: 0, max_value: 33, level: "Beginner", interpretation: "", recommendation: "" },
        { min_value: 34, max_value: 66, level: "Intermediate", interpretation: "", recommendation: "" },
        { min_value: 67, max_value: 100, level: "Advanced", interpretation: "", recommendation: "" }
      ]
    },
    access: {
      type: "public",
      allowed_users: [],
      allowed_roles: [],
      allowed_groups: []
    },
    tags: [],
    is_published: false
  });

  // Load test data when editing
  useEffect(() => {
    if (id && tests?.data && !testForm.title && !testLoading) {
      const testData = tests.data;
      
      // Find the course to set subjects
      const selectedCourse = course?.find(
        (c) => String(c._id) === String(testData.category?._id || testData.category)
      );
      
      if (selectedCourse?.subjects) {
        setSubjects(selectedCourse.subjects);
      }

      setTestForm({
        title: testData.title || "",
        description: testData.description || "",
        test_type: testData.test_type || "pre-test",
        category: testData.category?._id || testData.category || "",
        sub_category: testData.sub_category?._id || testData.sub_category || "",
        questions: testData.questions?.length > 0 
          ? testData.questions.map(q => ({
              ...q,
              options: q.options || [],
              question_text: q.question_text || "",
              explanation: q.explanation || q.solution || "",
              positive_mark: q.positive_mark || 0,
              negative_mark: q.negative_mark || 0,
              correct_options: q.correct_options || [],
              correct_option_text: q.correct_options?.join(', ') || "",
              max_value: q.max_value || 0,
              difficulty_level: q.difficulty_level || "medium",
              time_allocated_seconds: q.time_allocated_seconds || 60
            }))
          : [defaultQuestion(testData.test_type)],
        created_by: user?._id || testData.created_by?._id,
        settings: testData.settings || {
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
        },
        assessment_config: testData.assessment_config || {
          traits: [],
          default_interpretations: []
        },
        value_config: testData.value_config || {
          ranges: [
            { min_value: 0, max_value: 33, level: "Beginner", interpretation: "", recommendation: "" },
            { min_value: 34, max_value: 66, level: "Intermediate", interpretation: "", recommendation: "" },
            { min_value: 67, max_value: 100, level: "Advanced", interpretation: "", recommendation: "" }
          ]
        },
        access: testData.access || {
          type: "public",
          allowed_users: [],
          allowed_roles: [],
          allowed_groups: []
        },
        tags: testData.tags || [],
        is_published: testData.is_published || false
      });
    }
  }, [tests, course, user, testForm.title, defaultQuestion, id, testLoading]);

  const handleInputChange = (field, value) => {
    if (field === "category") {
      const selectedCourse = course?.find((c) => c._id === value);
      setSubjects(selectedCourse?.subjects || []);
    }
    setTestForm({ ...testForm, [field]: value });
  };

  const handleSettingsChange = (field, value) => {
    setTestForm({
      ...testForm,
      settings: {
        ...testForm.settings,
        [field]: value
      }
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...testForm.questions];
    updatedQuestions[index][field] = value;
    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const updatedQuestions = [...testForm.questions];
    updatedQuestions[qIndex].options[oIndex][field] = value;
    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setTestForm((prev) => ({
      ...prev,
      questions: [...prev.questions, defaultQuestion(prev.test_type)],
    }));
  };

  const removeQuestion = (index) => {
    const updatedQuestions = testForm.questions.filter(
      (_, i) => i !== index
    );
    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const addOption = (index) => {
    const updatedQuestions = [...testForm.questions];
    if (updatedQuestions[index].options.length < 6) {
      const isValueBased = testForm.test_type === "value_based";
      updatedQuestions[index].options.push({ 
        option_text: "", 
        option_value: isValueBased ? 0 : null,
        option_trait: null
      });
    }
    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const removeOption = (qIndex, oIndex) => {
    const updatedQuestions = [...testForm.questions];
    updatedQuestions[qIndex].options.splice(oIndex, 1);

    if (updatedQuestions[qIndex].options.length < 2) {
      const isValueBased = testForm.test_type === "value_based";
      updatedQuestions[qIndex].options.push({ 
        option_text: "", 
        option_value: isValueBased ? 0 : null,
        option_trait: null
      });
    }

    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const updateCorrectOption = (qIndex, oIndex) => {
    const question = testForm.questions[qIndex];
    const selectedOption = String.fromCharCode(65 + oIndex);
    const optionText = question.options[oIndex].option_text;

    const updatedQuestions = [...testForm.questions];
    updatedQuestions[qIndex].correct_options = [selectedOption];
    updatedQuestions[qIndex].correct_option_text = optionText;

    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const handleTraitChange = (qIndex, trait) => {
    const updatedQuestions = [...testForm.questions];
    // Update all options with the selected trait
    updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.map(opt => ({
      ...opt,
      option_trait: trait
    }));
    setTestForm({ ...testForm, questions: updatedQuestions });
  };

  const handleValueConfigChange = (index, field, value) => {
    const updatedRanges = [...testForm.value_config.ranges];
    updatedRanges[index][field] = value;
    setTestForm({
      ...testForm,
      value_config: {
        ...testForm.value_config,
        ranges: updatedRanges
      }
    });
  };

  const addValueRange = () => {
    setTestForm({
      ...testForm,
      value_config: {
        ...testForm.value_config,
        ranges: [
          ...testForm.value_config.ranges,
          { min_value: 0, max_value: 0, level: "", interpretation: "", recommendation: "" }
        ]
      }
    });
  };

  const removeValueRange = (index) => {
    const updatedRanges = testForm.value_config.ranges.filter((_, i) => i !== index);
    setTestForm({
      ...testForm,
      value_config: {
        ...testForm.value_config,
        ranges: updatedRanges
      }
    });
  };

  const handleTraitConfigChange = (index, field, value) => {
    const updatedTraits = [...testForm.assessment_config.traits];
    updatedTraits[index][field] = value;
    setTestForm({
      ...testForm,
      assessment_config: {
        ...testForm.assessment_config,
        traits: updatedTraits
      }
    });
  };

  const addTrait = () => {
    setTestForm({
      ...testForm,
      assessment_config: {
        ...testForm.assessment_config,
        traits: [
          ...testForm.assessment_config.traits,
          { trait_name: "", description: "", scoring_rules: [] }
        ]
      }
    });
  };

  const removeTrait = (index) => {
    const updatedTraits = testForm.assessment_config.traits.filter((_, i) => i !== index);
    setTestForm({
      ...testForm,
      assessment_config: {
        ...testForm.assessment_config,
        traits: updatedTraits
      }
    });
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

  const isAssessment = () => testForm.test_type === "assessment";
  const isValueBased = () => testForm.test_type === "value_based";
  const requiresCorrectAnswers = () => ["pre-test", "post-test", "correct_answer"].includes(testForm.test_type);

  const nextTab = () => {
    const tabs = getTabs();
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const tabs = getTabs();
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const validateForm = () => {
    // Validate title
    if (!testForm.title || testForm.title.trim() === "") {
      toast.error("Please enter a test title");
      setActiveTab("details");
      return false;
    }

    // Validate category
    if (!testForm.category) {
      toast.error("Please select a course/category");
      setActiveTab("details");
      return false;
    }

    // Validate questions
    if (testForm.questions.length === 0) {
      toast.error("Please add at least one question");
      setActiveTab("questions");
      return false;
    }

    // Validate based on test type
    for (let i = 0; i < testForm.questions.length; i++) {
      const q = testForm.questions[i];
      
      // Check question text
      if (!q.question_text || q.question_text.trim() === "") {
        toast.error(`Question ${i + 1} has no text`);
        setActiveTab("questions");
        return false;
      }

      // Check options
      const hasEmptyOption = q.options.some(opt => !opt.option_text || opt.option_text.trim() === "");
      if (hasEmptyOption) {
        toast.error(`Question ${i + 1} has empty options`);
        setActiveTab("questions");
        return false;
      }

      // Check correct answers for correct_answer tests
      if (requiresCorrectAnswers()) {
        if (!q.correct_options || q.correct_options.length === 0) {
          toast.error(`Question ${i + 1} must have a correct answer selected`);
          setActiveTab("questions");
          return false;
        }
      }

      // Check values for value-based tests
      if (isValueBased()) {
        const hasInvalidValue = q.options.some(opt => opt.option_value === null || opt.option_value === undefined);
        if (hasInvalidValue) {
          toast.error(`Question ${i + 1} has options without values`);
          setActiveTab("questions");
          return false;
        }
      }

      // Check traits for assessment tests
      if (isAssessment()) {
        const hasMissingTrait = q.options.some(opt => !opt.option_trait);
        if (hasMissingTrait) {
          toast.error(`Question ${i + 1} has options without trait mapping`);
          setActiveTab("questions");
          return false;
        }
      }
    }

    return true;
  };

  const saveTest = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
        const payload = {
            title: testForm.title,
            description: testForm.description,
            test_type: testForm.test_type,
            category: testForm.category,
            sub_category: testForm.sub_category || "",
            settings: testForm.settings,
            questions: testForm.questions.map((q) => {
                const questionData = {
                    ...q,
                    correct_options: isAssessment() || isValueBased() ? [] : q.correct_options,
                    positive_mark: isAssessment() || isValueBased() ? 0 : q.positive_mark,
                    negative_mark: isAssessment() || isValueBased() ? 0 : q.negative_mark,
                };
                return questionData;
            }),
            assessment_config: isAssessment() ? testForm.assessment_config : undefined,
            value_config: isValueBased() ? testForm.value_config : undefined,
            access: testForm.access,
            tags: testForm.tags,
            is_published: testForm.is_published
        };

        // Remove undefined fields
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) delete payload[key];
        });

        // For update, remove created_by from payload
        if (id) {
            delete payload.created_by;
        }

        if (!id) {
            // For create, add created_by
            payload.created_by = user?._id;
            await createTest(payload);
            toast.success("Test created successfully!");
            navigate("/instructor/tests");
        } else {
            await updateTest(id, payload);
            toast.success("Test updated successfully!");
            navigate("/instructor/tests");
        }
    } catch (error) {
        console.error("Error saving test:", error);
        toast.error(error.message || "Failed to save test");
    } finally {
        setIsSubmitting(false);
    }
};

  const getTestTypeDescription = (type) => {
    const descriptions = {
      'pre-test': 'Pre-tests assess prior knowledge before a course/lesson. They have correct answers and are graded.',
      'post-test': 'Post-tests measure learning outcomes after a course/lesson. They have correct answers and are graded.',
      'correct_answer': 'Standard multiple choice tests with correct answers and grading.',
      'assessment': 'Assessment tests have no correct answers. Users select options based on preferences. Results show trait profiles.',
      'value_based': 'Value-based tests have options with numerical values. Results are calculated based on selected values.'
    };
    return descriptions[type] || '';
  };

  const tabs = getTabs();

  // Loading state
  if (testLoading || courseLoading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading test data...</p>
      </div>
    );
  }

  return (
    <div className="test-form-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 className="test-form-heading" style={{ marginBottom: "24px" }}>
        {id ? "Edit Test" : "Create New Test"}
      </h1>

      <div className="test-tabs" style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "2px solid #e9ecef", paddingBottom: "12px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "active" : ""}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: activeTab === tab ? "#4f46e5" : "transparent",
              color: activeTab === tab ? "#fff" : "#495057",
              fontWeight: "500",
              transition: "all 0.2s"
            }}
          >
            {tab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* DETAILS TAB */}
      {activeTab === "details" && (
        <form className="test-form" onSubmit={(e) => { e.preventDefault(); nextTab(); }}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Test Title *</label>
            <input
              type="text"
              className="form-input"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
              value={testForm.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              placeholder="Enter test title"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Description</label>
            <ReactQuill
              value={testForm.description}
              onChange={(content) => handleInputChange("description", content)}
              style={{ height: "150px", marginBottom: "40px" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Test Type *</label>
            <select
              className="form-select"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
              value={testForm.test_type}
              onChange={(e) => {
                const newType = e.target.value;
                setTestForm({
                  ...testForm,
                  test_type: newType,
                  questions: [defaultQuestion(newType)]
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
            <small className="form-help-text" style={{ display: "block", marginTop: "4px", color: "#6c757d", fontSize: "14px" }}>
              {getTestTypeDescription(testForm.test_type)}
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Course/Category *</label>
            <select
              className="form-select"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
              value={testForm.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              required
            >
              <option value="">Select Course</option>
              {course?.map((crs) => (
                <option key={crs._id} value={crs._id}>
                  {crs.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Subject/Lesson</label>
            <select
              className="form-select"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
              value={testForm.sub_category}
              onChange={(e) => handleInputChange("sub_category", e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects?.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Time Limit (Minutes)</label>
            <input
              type="number"
              className="form-input"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
              value={testForm.settings.time_limit_minutes || ""}
              onChange={(e) => handleSettingsChange("time_limit_minutes", parseInt(e.target.value) || 30)}
              min="1"
              placeholder="30"
            />
          </div>

          {requiresCorrectAnswers() && (
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Passing Percentage (%)</label>
              <input
                type="number"
                className="form-input"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.settings.passing_percentage || 40}
                onChange={(e) => handleSettingsChange("passing_percentage", parseInt(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Tags</label>
            <input
              type="text"
              className="form-input"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
              value={testForm.tags?.join(', ') || ""}
              onChange={(e) => handleInputChange("tags", e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="button-container" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button type="submit" className="test-button test-button-primary" style={{ padding: "10px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Next →
            </button>
          </div>
        </form>
      )}

      {/* ASSESSMENT CONFIG TAB */}
      {activeTab === "assessment_config" && isAssessment() && (
        <form className="test-form" onSubmit={(e) => { e.preventDefault(); nextTab(); }}>
          <h3 style={{ marginBottom: "16px" }}>Assessment Configuration</h3>
          <p className="text-muted" style={{ color: "#6c757d", marginBottom: "20px" }}>Define traits for this assessment test</p>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Traits</label>
            {testForm.assessment_config.traits.map((trait, index) => (
              <div key={index} style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px", borderRadius: "6px" }}>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Trait Name</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                    value={trait.trait_name || ""}
                    onChange={(e) => handleTraitConfigChange(index, "trait_name", e.target.value)}
                    placeholder="e.g., Visual, Auditory, Kinesthetic"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Description</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                    value={trait.description || ""}
                    onChange={(e) => handleTraitConfigChange(index, "description", e.target.value)}
                    placeholder="Brief description of this trait"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTrait(index)}
                  className="test-button-danger test-button"
                  style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Remove Trait
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTrait}
              className="test-button-secondary test-button"
              style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              + Add Trait
            </button>
          </div>

          <div className="button-container" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={prevTab} className="test-button-secondary test-button" style={{ padding: "10px 24px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              ← Previous
            </button>
            <button type="submit" className="test-button-primary test-button" style={{ padding: "10px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Next →
            </button>
          </div>
        </form>
      )}

      {/* VALUE CONFIG TAB */}
      {activeTab === "value_config" && isValueBased() && (
        <form className="test-form" onSubmit={(e) => { e.preventDefault(); nextTab(); }}>
          <h3 style={{ marginBottom: "16px" }}>Value-Based Configuration</h3>
          <p className="text-muted" style={{ color: "#6c757d", marginBottom: "20px" }}>Define score ranges for value-based tests</p>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Score Ranges</label>
            {testForm.value_config.ranges.map((range, index) => (
              <div key={index} style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "12px", borderRadius: "6px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Min Value</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                      value={range.min_value || 0}
                      onChange={(e) => handleValueConfigChange(index, "min_value", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Max Value</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                      value={range.max_value || 0}
                      onChange={(e) => handleValueConfigChange(index, "max_value", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Level</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                      value={range.level || ""}
                      onChange={(e) => handleValueConfigChange(index, "level", e.target.value)}
                      placeholder="e.g., Beginner"
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Interpretation</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                    value={range.interpretation || ""}
                    onChange={(e) => handleValueConfigChange(index, "interpretation", e.target.value)}
                    placeholder="Interpretation for this range"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Recommendation</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                    value={range.recommendation || ""}
                    onChange={(e) => handleValueConfigChange(index, "recommendation", e.target.value)}
                    placeholder="Recommendation for this range"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeValueRange(index)}
                  className="test-button-danger test-button"
                  style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Remove Range
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addValueRange}
              className="test-button-secondary test-button"
              style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              + Add Score Range
            </button>
          </div>

          <div className="button-container" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={prevTab} className="test-button-secondary test-button" style={{ padding: "10px 24px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              ← Previous
            </button>
            <button type="submit" className="test-button-primary test-button" style={{ padding: "10px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Next →
            </button>
          </div>
        </form>
      )}

      {/* QUESTIONS TAB */}
      {activeTab === "questions" && (
        <form className="test-form" onSubmit={(e) => { e.preventDefault(); nextTab(); }}>
          <div className="questions-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>Questions ({testForm.questions.length})</h3>
            <button type="button" onClick={addQuestion} className="test-button-secondary test-button" style={{ padding: "8px 16px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              + Add Question
            </button>
          </div>

          {testForm.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card" style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "20px", borderRadius: "8px", backgroundColor: "#fff" }}>
              <div className="d-flex justify-content-between" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0 }}>Question {qIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="test-button-danger test-button"
                  style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Question Text *</label>
                <ReactQuill
                  value={question.question_text}
                  onChange={(content) => handleQuestionChange(qIndex, "question_text", content)}
                  style={{ height: "100px", marginBottom: "40px" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Question Category</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                  value={question.question_category || "general"}
                  onChange={(e) => handleQuestionChange(qIndex, "question_category", e.target.value)}
                  placeholder="e.g., Math, Science, General"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Difficulty Level</label>
                <select
                  className="form-select"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                  value={question.difficulty_level || "medium"}
                  onChange={(e) => handleQuestionChange(qIndex, "difficulty_level", e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {isAssessment() && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Trait Mapping</label>
                  <select
                    className="form-select"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                    value={question.options[0]?.option_trait || ""}
                    onChange={(e) => handleTraitChange(qIndex, e.target.value)}
                  >
                    <option value="">Select Trait</option>
                    {testForm.assessment_config.traits.map((trait, idx) => (
                      <option key={idx} value={trait.trait_name}>
                        {trait.trait_name}
                      </option>
                    ))}
                  </select>
                  <small className="form-help-text" style={{ display: "block", marginTop: "4px", color: "#6c757d", fontSize: "12px" }}>
                    Map this question to a trait for assessment scoring
                  </small>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Options</label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-item" style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <span className="option-label" style={{ fontWeight: "bold", paddingTop: "8px", minWidth: "24px" }}>{String.fromCharCode(65 + oIndex)}</span>
                    <ReactQuill
                      value={option.option_text}
                      onChange={(content) => handleOptionChange(qIndex, oIndex, "option_text", content)}
                      style={{ flex: 1, height: "60px", marginBottom: "30px" }}
                    />
                    
                    {isValueBased() && (
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Value"
                        value={option.option_value || 0}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, "option_value", parseInt(e.target.value) || 0)}
                        style={{ width: "80px", padding: "8px", borderRadius: "6px", border: "1px solid #ced4da", marginTop: "4px" }}
                        min="0"
                      />
                    )}

                    {requiresCorrectAnswers() && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correct_options.includes(String.fromCharCode(65 + oIndex))}
                          onChange={() => updateCorrectOption(qIndex, oIndex)}
                        />
                        <label style={{ fontSize: "12px" }}>✓</label>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="test-button-danger"
                      disabled={question.options.length <= 2}
                      style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "4px" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="test-button-secondary test-button"
                  disabled={question.options.length >= 6}
                  style={{ padding: "6px 12px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  + Add Option
                </button>
              </div>

              {requiresCorrectAnswers() && (
                <>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Correct Answer</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da", backgroundColor: "#f8f9fa" }}
                      value={question.correct_option_text || "No correct option selected"}
                      disabled
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Positive Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                        value={question.positive_mark || 0}
                        onChange={(e) => handleQuestionChange(qIndex, "positive_mark", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Negative Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                        value={question.negative_mark || 0}
                        onChange={(e) => handleQuestionChange(qIndex, "negative_mark", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Explanation/Solution</label>
                <ReactQuill
                  value={question.explanation || ""}
                  onChange={(content) => handleQuestionChange(qIndex, "explanation", content)}
                  style={{ height: "100px", marginBottom: "40px" }}
                />
              </div>
            </div>
          ))}

          <div className="button-container" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={prevTab} className="test-button-secondary test-button" style={{ padding: "10px 24px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              ← Previous
            </button>
            <button type="submit" className="test-button-primary test-button" style={{ padding: "10px 24px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Next →
            </button>
          </div>
        </form>
      )}

      {/* SOLUTIONS TAB */}
      {activeTab === "solutions" && (
        <form className="test-form" onSubmit={(e) => { e.preventDefault(); saveTest(); }}>
          <h3 style={{ marginBottom: "8px" }}>Review & Submit</h3>
          <p className="text-muted" style={{ color: "#6c757d", marginBottom: "20px" }}>Review all questions and explanations before submitting</p>

          <div className="test-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
            <div className="summary-item">
              <strong>Test Name:</strong> {testForm.title || "Untitled"}
            </div>
            <div className="summary-item">
              <strong>Test Type:</strong> {testForm.test_type.replace(/_/g, " ")}
            </div>
            <div className="summary-item">
              <strong>Total Questions:</strong> {testForm.questions.length}
            </div>
          </div>

          {testForm.questions.map((question, index) => (
            <div key={index} className="question-solution-form-item" style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "16px", borderRadius: "8px", backgroundColor: "#fff" }}>
              <h4 style={{ marginBottom: "8px" }}>Solution for Question {index + 1}</h4>
              <div className="question-preview" dangerouslySetInnerHTML={{ __html: question.question_text }} style={{ marginBottom: "12px", padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "4px" }} />
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: "500", marginBottom: "4px" }}>Explanation/Solution</label>
                <ReactQuill
                  value={question.explanation || ""}
                  onChange={(content) => handleQuestionChange(index, "explanation", content)}
                  style={{ height: "100px", marginBottom: "40px" }}
                />
              </div>
            </div>
          ))}

          <div className="button-container" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={prevTab} className="test-button-secondary test-button" style={{ padding: "10px 24px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              ← Previous
            </button>
            <button 
              type="submit" 
              className="test-button-primary test-button" 
              disabled={isSubmitting}
              style={{ 
                padding: "10px 24px", 
                backgroundColor: isSubmitting ? "#6c757d" : "#4f46e5", 
                color: "#fff", 
                border: "none", 
                borderRadius: "6px", 
                cursor: isSubmitting ? "not-allowed" : "pointer" 
              }}
            >
              {isSubmitting ? "Saving..." : (id ? "Update Test" : "Create Test")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TestFormReact;