// views/ui/PsychometricTestForm.jsx
import React, { Component } from "react";
import toast from "react-hot-toast";
import { Navigate, useParams } from "react-router-dom";
import { useAuthcontext } from "../../contexts/Authcontext";
import { 
  useAdminGetPsychometricTest, 
  useAdminCreatePsychometricTest, 
  useAdminUpdatePsychometricTest 
} from "../../hooks/PsychometricTest/psuchometricTest";

// ================================================================
// WITH HOOKS WRAPPER
// ================================================================

const withHooks = (WrappedComponent) => {
  return function Wrapper(props) {
    const { authUser } = useAuthcontext();
    const { getTest } = useAdminGetPsychometricTest();
    const { createTest } = useAdminCreatePsychometricTest();
    const { updateTest } = useAdminUpdatePsychometricTest();
    const { id } = useParams();

    return (
      <WrappedComponent
        {...props}
        authUser={authUser}
        getTest={getTest}
        createTest={createTest}
        updateTest={updateTest}
        id = { id }
      />
    );
  };
};

// ================================================================
// DEFAULT SECTIONS (Static Property)
// ================================================================

const DEFAULT_SECTIONS = {
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

// ================================================================
// CLASS COMPONENT
// ================================================================

class PsychometricTestForm extends Component {
  // ================================================================
  // CONSTRUCTOR
  // ================================================================

  constructor(props) {
    super(props);


    const { id } = props;

    this.state = {
      testForm: {
        title: "",
        version: "1.0",
        language: "en",
        sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)),
        settings: {
          time_limit_minutes: 60,
          passing_percentage: 40,
          allow_retake: true,
          retake_delay_days: 30,
          show_results_immediately: true,
        },
        is_active: true,
      },
      activeSection: "s1",
      editMode: false,
      loading: false,
      isSubmitting: false,
    };

    // Bind methods
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.handleSectionChange = this.handleSectionChange.bind(this);
    this.handleQuestionChange = this.handleQuestionChange.bind(this);
    this.addQuestion = this.addQuestion.bind(this);
    this.removeQuestion = this.removeQuestion.bind(this);
    this.addSubject = this.addSubject.bind(this);
    this.removeSubject = this.removeSubject.bind(this);
    this.addAttackType = this.addAttackType.bind(this);
    this.removeAttackType = this.removeAttackType.bind(this);
    this.setActiveSection = this.setActiveSection.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.saveTest = this.saveTest.bind(this);
    this.loadTestData = this.loadTestData.bind(this);
    this.renderSectionConfig = this.renderSectionConfig.bind(this);
  }

  // ================================================================
  // LIFECYCLE METHODS
  // ================================================================

  componentDidMount() {
    const { id } = this.props;
    if (id) {
      this.loadTestData();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id && this.props.id) {
      this.loadTestData();
    }
  }

  // ================================================================
  // METHODS
  // ================================================================

  loadTestData() {
    const { id, getTest } = this.props;
    if (!id) return;
    console.log("The edit test data: ", id);

    this.setState({ loading: true });

    getTest(id)
      .then((res) => {
        if (res.success) {
          this.setState({
            testForm: res.data,
            editMode: true,
          });
        }
      })
      .catch((error) => {
        toast.error("Failed to load test");
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleInputChange(field, value) {
    this.setState((prev) => ({
      testForm: { ...prev.testForm, [field]: value }
    }));
  }

  handleSettingsChange(field, value) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        settings: { ...prev.testForm.settings, [field]: value }
      }
    }));
  }

  handleSectionChange(sectionKey, field, value) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        sections: {
          ...prev.testForm.sections,
          [sectionKey]: {
            ...prev.testForm.sections[sectionKey],
            [field]: value
          }
        }
      }
    }));
  }

  handleQuestionChange(sectionKey, questionIndex, field, value) {
    this.setState((prev) => {
      const updatedQuestions = [...prev.testForm.sections[sectionKey].questions];
      updatedQuestions[questionIndex][field] = value;
      return {
        testForm: {
          ...prev.testForm,
          sections: {
            ...prev.testForm.sections,
            [sectionKey]: {
              ...prev.testForm.sections[sectionKey],
              questions: updatedQuestions
            }
          }
        }
      };
    });
  }

  addQuestion(sectionKey) {
    this.setState((prev) => {
      const questions = prev.testForm.sections[sectionKey].questions || [];
      return {
        testForm: {
          ...prev.testForm,
          sections: {
            ...prev.testForm.sections,
            [sectionKey]: {
              ...prev.testForm.sections[sectionKey],
              questions: [
                ...questions,
                { id: `q_${questions.length + 1}`, text: "", field: "", type: "rating", min: 1, max: 10 }
              ]
            }
          }
        }
      };
    });
  }

  removeQuestion(sectionKey, questionIndex) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        sections: {
          ...prev.testForm.sections,
          [sectionKey]: {
            ...prev.testForm.sections[sectionKey],
            questions: prev.testForm.sections[sectionKey].questions.filter((_, i) => i !== questionIndex)
          }
        }
      }
    }));
  }

  addSubject(sectionKey) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        sections: {
          ...prev.testForm.sections,
          [sectionKey]: {
            ...prev.testForm.sections[sectionKey],
            subjects: [...(prev.testForm.sections[sectionKey].subjects || []), ""]
          }
        }
      }
    }));
  }

  removeSubject(sectionKey, subjectIndex) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        sections: {
          ...prev.testForm.sections,
          [sectionKey]: {
            ...prev.testForm.sections[sectionKey],
            subjects: prev.testForm.sections[sectionKey].subjects.filter((_, i) => i !== subjectIndex)
          }
        }
      }
    }));
  }

  addAttackType(sectionKey) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        sections: {
          ...prev.testForm.sections,
          [sectionKey]: {
            ...prev.testForm.sections[sectionKey],
            attack_types: [...(prev.testForm.sections[sectionKey].attack_types || []), ""]
          }
        }
      }
    }));
  }

  removeAttackType(sectionKey, index) {
    this.setState((prev) => ({
      testForm: {
        ...prev.testForm,
        sections: {
          ...prev.testForm.sections,
          [sectionKey]: {
            ...prev.testForm.sections[sectionKey],
            attack_types: prev.testForm.sections[sectionKey].attack_types.filter((_, i) => i !== index)
          }
        }
      }
    }));
  }

  setActiveSection(sectionKey) {
    this.setState({ activeSection: sectionKey });
  }

  validateForm() {
    const { testForm } = this.state;
    if (!testForm.title || testForm.title.trim() === "") {
      toast.error("Please enter a test title");
      return false;
    }
    return true;
  }

  saveTest() {
    if (!this.validateForm()) return;

    const { testForm, editMode } = this.state;
    const { id, createTest, updateTest, navigate } = this.props;

    this.setState({ isSubmitting: true });

    const payload = {
      title: testForm.title,
      version: testForm.version,
      language: testForm.language,
      sections: testForm.sections,
      settings: testForm.settings,
      is_active: testForm.is_active,
    };

    const savePromise = editMode && id
      ? updateTest(id, payload)
      : createTest(payload);

    savePromise
      .then(() => {
        toast.success(editMode ? "Test updated successfully!" : "Test created successfully!");
        navigate("/instructor/psychometric-tests");
      })
      .catch((error) => {
        toast.error(error.message || "Failed to save test");
      })
      .finally(() => {
        this.setState({ isSubmitting: false });
      });
  }

  // ================================================================
  // RENDER METHODS
  // ================================================================

  renderSectionConfig(sectionKey) {
    const { testForm } = this.state;
    const section = testForm.sections[sectionKey];
    if (!section) return null;

    return (
      <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h4 style={{ margin: 0 }}>{section.name}</h4>
          <span style={{ fontSize: "12px", color: "#6c757d" }}>{sectionKey.toUpperCase()}</span>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Description</label>
          <input
            type="text"
            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
            value={section.description || ""}
            onChange={(e) => this.handleSectionChange(sectionKey, "description", e.target.value)}
            placeholder="Section description"
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Time Limit (Minutes)</label>
          <input
            type="number"
            style={{ width: "150px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
            value={section.time_limit_minutes || 5}
            onChange={(e) => this.handleSectionChange(sectionKey, "time_limit_minutes", parseInt(e.target.value) || 5)}
            min="1"
          />
        </div>

        {this.renderQuestions(sectionKey, section)}
        {this.renderSubjects(sectionKey, section)}
        {this.renderAttackTypes(sectionKey, section)}
      </div>
    );
  }

  renderQuestions(sectionKey, section) {
    if (!section.questions) return null;

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", marginBottom: "12px" }}>
          <h5 style={{ margin: 0 }}>Questions ({section.questions.length})</h5>
          <button
            type="button"
            onClick={() => this.addQuestion(sectionKey)}
            style={{ padding: "4px 12px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {section.questions.map((q, qIndex) => (
          <div key={qIndex} style={{ border: "1px solid #eee", padding: "12px", borderRadius: "6px", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                style={{ flex: 2, minWidth: "150px", padding: "6px 10px", borderRadius: "4px", border: "1px solid #ced4da" }}
                value={q.text || ""}
                onChange={(e) => this.handleQuestionChange(sectionKey, qIndex, "text", e.target.value)}
                placeholder="Question text"
              />
              <input
                type="text"
                style={{ width: "120px", padding: "6px 10px", borderRadius: "4px", border: "1px solid #ced4da" }}
                value={q.field || ""}
                onChange={(e) => this.handleQuestionChange(sectionKey, qIndex, "field", e.target.value)}
                placeholder="Field name"
              />
              <select
                style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ced4da" }}
                value={q.type || "rating"}
                onChange={(e) => this.handleQuestionChange(sectionKey, qIndex, "type", e.target.value)}
              >
                <option value="rating">Rating</option>
                <option value="mcq">MCQ</option>
                <option value="text">Text</option>
                <option value="score">Score</option>
              </select>
              <button
                type="button"
                onClick={() => this.removeQuestion(sectionKey, qIndex)}
                style={{ padding: "4px 8px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </>
    );
  }

  renderSubjects(sectionKey, section) {
    if (!section.subjects) return null;

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", marginBottom: "12px" }}>
          <h5 style={{ margin: 0 }}>Subjects ({section.subjects.length})</h5>
          <button
            type="button"
            onClick={() => this.addSubject(sectionKey)}
            style={{ padding: "4px 12px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {section.subjects.map((subject, sIndex) => (
          <div key={sIndex} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              style={{ flex: 1, padding: "6px 10px", borderRadius: "4px", border: "1px solid #ced4da" }}
              value={subject}
              onChange={(e) => {
                const updated = [...section.subjects];
                updated[sIndex] = e.target.value;
                this.handleSectionChange(sectionKey, "subjects", updated);
              }}
              placeholder="Subject name"
            />
            <button
              type="button"
              onClick={() => this.removeSubject(sectionKey, sIndex)}
              style={{ padding: "4px 8px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ))}
      </>
    );
  }

  renderAttackTypes(sectionKey, section) {
    if (!section.attack_types) return null;

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", marginBottom: "12px" }}>
          <h5 style={{ margin: 0 }}>Attack Types ({section.attack_types.length})</h5>
          <button
            type="button"
            onClick={() => this.addAttackType(sectionKey)}
            style={{ padding: "4px 12px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add
          </button>
        </div>

        {section.attack_types.map((type, tIndex) => (
          <div key={tIndex} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              style={{ flex: 1, padding: "6px 10px", borderRadius: "4px", border: "1px solid #ced4da" }}
              value={type}
              onChange={(e) => {
                const updated = [...section.attack_types];
                updated[tIndex] = e.target.value;
                this.handleSectionChange(sectionKey, "attack_types", updated);
              }}
              placeholder="Attack type"
            />
            <button
              type="button"
              onClick={() => this.removeAttackType(sectionKey, tIndex)}
              style={{ padding: "4px 8px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ))}
      </>
    );
  }

  // ================================================================
  // MAIN RENDER
  // ================================================================

  render() {
    const { testForm, activeSection, loading, isSubmitting, editMode } = this.state;
    const { navigate } = this.props;

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: "16px" }}>Loading test data...</p>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1 style={{ marginBottom: "24px" }}>
          {editMode ? "Edit Psychometric Test" : "Create Psychometric Test"}
        </h1>

        {/* Basic Info */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
          <h4 style={{ marginBottom: "16px" }}>Basic Information</h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Test Title *</label>
              <input
                type="text"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.title}
                onChange={(e) => this.handleInputChange("title", e.target.value)}
                placeholder="Enter test title"
              />
            </div>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Version</label>
              <input
                type="text"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.version}
                onChange={(e) => this.handleInputChange("version", e.target.value)}
                placeholder="1.0"
              />
            </div>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Language</label>
              <select
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.language}
                onChange={(e) => this.handleInputChange("language", e.target.value)}
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="bn">Bengali</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Active</label>
              <select
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.is_active ? "true" : "false"}
                onChange={(e) => this.handleInputChange("is_active", e.target.value === "true")}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
          <h4 style={{ marginBottom: "16px" }}>Settings</h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Time Limit (Minutes)</label>
              <input
                type="number"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.settings.time_limit_minutes}
                onChange={(e) => this.handleSettingsChange("time_limit_minutes", parseInt(e.target.value) || 60)}
                min="1"
              />
            </div>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Allow Retake</label>
              <select
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.settings.allow_retake ? "true" : "false"}
                onChange={(e) => this.handleSettingsChange("allow_retake", e.target.value === "true")}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "500", marginBottom: "4px", display: "block" }}>Retake Delay (Days)</label>
              <input
                type="number"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ced4da" }}
                value={testForm.settings.retake_delay_days || 30}
                onChange={(e) => this.handleSettingsChange("retake_delay_days", parseInt(e.target.value) || 30)}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
          <h4 style={{ marginBottom: "16px" }}>Sections (S1-S5)</h4>

          {/* Section Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {Object.keys(testForm.sections).map((key) => (
              <button
                key={key}
                onClick={() => this.setActiveSection(key)}
                style={{
                  padding: "8px 16px",
                  border: activeSection === key ? "2px solid #4f46e5" : "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: activeSection === key ? "#eef2ff" : "#fff",
                  fontWeight: activeSection === key ? "600" : "400",
                  color: activeSection === key ? "#4f46e5" : "#333"
                }}
              >
                {key.toUpperCase()} - {testForm.sections[key].name}
              </button>
            ))}
          </div>

          {this.renderSectionConfig(activeSection)}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            type="button"
            onClick={() => navigate("/instructor/psychometric-tests")}
            style={{ padding: "10px 24px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={this.saveTest}
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
            {isSubmitting ? "Saving..." : (editMode ? "Update Test" : "Create Test")}
          </button>
        </div>
      </div>
    );
  }
}

// ================================================================
// EXPORT WITH HOOKS
// ================================================================

export default withHooks(PsychometricTestForm);