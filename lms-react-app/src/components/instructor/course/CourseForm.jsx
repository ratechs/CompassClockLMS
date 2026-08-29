import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
} from "reactstrap";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import classNames from "classnames";
import { useAuthcontext } from "../../../contexts/Authcontext";

const TABS = {
  COURSE: "course",
  SUBJECTS: "subjects",
  MATERIALS: "materials",
};

const TAB_LIST = [
  {
    id: TABS.COURSE,
    title: "Course Details",
    shortTitle: "Course",
    icon: "bi bi-book",
  },
  {
    id: TABS.SUBJECTS,
    title: "Subjects",
    shortTitle: "Subjects",
    icon: "bi bi-journal-text",
  },
  {
    id: TABS.MATERIALS,
    title: "Materials",
    shortTitle: "Materials",
    icon: "bi bi-file-earmark-text",
  },
];

const createMaterial = () => ({
  name: "",
  description: "",
  content_type: "",
  content_url: "",
});

const createSubject = () => ({
  name: "",
  description: "",
  duration: "",
  materials: [createMaterial()],
});

const EMPTY_COURSE = {
  name: "",
  description: "",
  duration: "",
  imageUrl: "",
  course_type: "",
  join_code: "",
  subjects: [createSubject()],
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const materialQuillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

/* ---------------------------------------------------------
   Reusable Components
--------------------------------------------------------- */

const SectionHeader = ({ number, title, description }) => (
  <div className="section-header mb-4">
    <div className="section-number">{number}</div>

    <div>
      <h4 className="mb-1">{title}</h4>
      {description && (
        <p className="text-muted mb-0 small">{description}</p>
      )}
    </div>
  </div>
);

const RichTextField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  modules = quillModules,
}) => (
  <FormGroup className="mb-4">
    <Label className="form-label-custom">
      {label} {required && <span className="text-danger">*</span>}
    </Label>

    <div className="rich-editor">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  </FormGroup>
);

const FieldLabel = ({ children, required }) => (
  <Label className="form-label-custom">
    {children} {required && <span className="text-danger">*</span>}
  </Label>
);

/* ---------------------------------------------------------
   Subject Card
--------------------------------------------------------- */

const SubjectCard = ({
  subject,
  index,
  totalSubjects,
  onChange,
  onDelete,
  disabled,
}) => {
  return (
    <div className="dynamic-card mb-4">
      <div className="dynamic-card-header">
        <div className="d-flex align-items-center gap-3">
          <div className="item-number">{index + 1}</div>

          <div>
            <h5 className="mb-0">
              {subject.name || `Subject ${index + 1}`}
            </h5>
            <small className="text-muted">
              Configure subject information
            </small>
          </div>
        </div>

        {totalSubjects > 1 && (
          <Button
            color="light"
            className="delete-button"
            onClick={onDelete}
            disabled={disabled}
            type="button"
            title="Remove subject"
          >
            <i className="bi bi-trash3 text-danger" />
          </Button>
        )}
      </div>

      <div className="dynamic-card-body">
        <Row>
          <Col md="8">
            <FormGroup>
              <FieldLabel required>Subject Name</FieldLabel>

              <Input
                type="text"
                value={subject.name}
                placeholder="e.g. Introduction to React"
                onChange={(e) =>
                  onChange(index, "name", e.target.value)
                }
                disabled={disabled}
              />
            </FormGroup>
          </Col>

          <Col md="4">
            <FormGroup>
              <FieldLabel required>Duration</FieldLabel>

              <div className="input-group">
                <Input
                  type="number"
                  min="1"
                  value={subject.duration}
                  placeholder="e.g. 3"
                  onChange={(e) =>
                    onChange(index, "duration", e.target.value)
                  }
                  disabled={disabled}
                />

                <span className="input-group-text">Months</span>
              </div>
            </FormGroup>
          </Col>
        </Row>

        <RichTextField
          label="Subject Description"
          required
          value={subject.description}
          onChange={(value) =>
            onChange(index, "description", value)
          }
          placeholder="Describe what students will learn in this subject..."
        />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   Material Card
--------------------------------------------------------- */

const MaterialCard = ({
  material,
  subjectIndex,
  materialIndex,
  totalMaterials,
  onChange,
  onDelete,
  disabled,
}) => {
  return (
    <div className="material-card">
      <div className="material-header">
        <div className="d-flex align-items-center gap-2">
          <div className="material-icon">
            <i className="bi bi-file-earmark" />
          </div>

          <div>
            <strong>
              {material.name || `Material ${materialIndex + 1}`}
            </strong>

            <div className="small text-muted">
              Learning resource
            </div>
          </div>
        </div>

        {totalMaterials > 1 && (
          <Button
            color="light"
            className="delete-button"
            onClick={onDelete}
            disabled={disabled}
            type="button"
          >
            <i className="bi bi-trash3 text-danger" />
          </Button>
        )}
      </div>

      <div className="material-body">
        <FormGroup>
          <FieldLabel required>Material Name</FieldLabel>

          <Input
            type="text"
            value={material.name}
            placeholder="e.g. React Introduction PDF"
            onChange={(e) =>
              onChange(
                subjectIndex,
                materialIndex,
                "name",
                e.target.value
              )
            }
            disabled={disabled}
          />
        </FormGroup>

        <RichTextField
          label="Description"
          value={material.description}
          onChange={(value) =>
            onChange(
              subjectIndex,
              materialIndex,
              "description",
              value
            )
          }
          placeholder="Describe this learning material..."
          modules={materialQuillModules}
        />

        <Row>
          <Col md="6">
            <FormGroup>
              <FieldLabel required>Content Type</FieldLabel>

              <Input
                type="select"
                value={material.content_type}
                onChange={(e) =>
                  onChange(
                    subjectIndex,
                    materialIndex,
                    "content_type",
                    e.target.value
                  )
                }
                disabled={disabled}
              >
                <option value="">Select content type</option>
                <option value="PDF">PDF</option>
                <option value="Video">Video</option>
                <option value="Document">Document</option>
                <option value="Image">Image</option>
              </Input>
            </FormGroup>
          </Col>

          <Col md="6">
            <FormGroup>
              <FieldLabel>Content URL</FieldLabel>

              <Input
                type="url"
                value={material.content_url}
                placeholder="https://example.com/file.pdf"
                onChange={(e) =>
                  onChange(
                    subjectIndex,
                    materialIndex,
                    "content_url",
                    e.target.value
                  )
                }
                disabled={disabled}
              />

              <small className="text-muted">
                Add the URL where students can access this material.
              </small>
            </FormGroup>
          </Col>
        </Row>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */

const CourseForm = () => {
  const { authUser } = useAuthcontext();
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS.COURSE);
  const [courseData, setCourseData] = useState({
    ...EMPTY_COURSE,
    created_by: authUser?.user,
  });

  const [loading, setLoading] = useState(Boolean(courseId));
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------------------------------
     Current Step
  --------------------------------------------------------- */

  const currentStep = useMemo(
    () => TAB_LIST.findIndex((tab) => tab.id === activeTab),
    [activeTab]
  );

  const progress = ((currentStep + 1) / TAB_LIST.length) * 100;

  /* ---------------------------------------------------------
     Load Course
  --------------------------------------------------------- */

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/courses/${courseId}`);

        const course = response.data;

        const subjects =
          Array.isArray(course.subjects) && course.subjects.length
            ? course.subjects.map((subject) => ({
                _id: subject?._id || "",
                name: subject?.name || "",
                description: subject?.description || "",
                duration: subject?.duration || "",
                materials:
                  Array.isArray(subject?.materials) &&
                  subject.materials.length
                    ? subject.materials.map((material) => ({
                        _id: material?._id || "",
                        name: material?.name || "",
                        description: material?.description || "",
                        content_type: material?.content_type || "",
                        content_url: material?.content_url || "",
                      }))
                    : [createMaterial()],
              }))
            : [createSubject()];

        setCourseData({
          name: course.name || "",
          description: course.description || "",
          duration: course.duration || "",
          imageUrl: course.imageUrl || "",
          course_type: course.course_type || "",
          join_code: course.join_code || "",
          subjects,
          created_by: course.created_by || authUser?.user,
        });
      } catch (error) {
        console.error("Error loading course:", error);

        toast.error(
          error.response?.data?.message ||
            "Unable to load course data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, authUser]);

  /* ---------------------------------------------------------
     Course Fields
  --------------------------------------------------------- */

  const updateCourseField = (field, value) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ---------------------------------------------------------
     Subject Functions
  --------------------------------------------------------- */

  const updateSubject = (index, field, value) => {
    setCourseData((prev) => {
      const subjects = [...prev.subjects];

      subjects[index] = {
        ...subjects[index],
        [field]: value,
      };

      return {
        ...prev,
        subjects,
      };
    });
  };

  const addSubject = () => {
    setCourseData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, createSubject()],
    }));
  };

  const removeSubject = (index) => {
    setCourseData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  /* ---------------------------------------------------------
     Material Functions
  --------------------------------------------------------- */

  const updateMaterial = (
    subjectIndex,
    materialIndex,
    field,
    value
  ) => {
    setCourseData((prev) => {
      const subjects = [...prev.subjects];

      const materials = [...subjects[subjectIndex].materials];

      materials[materialIndex] = {
        ...materials[materialIndex],
        [field]: value,
      };

      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        materials,
      };

      return {
        ...prev,
        subjects,
      };
    });
  };

  const addMaterial = (subjectIndex) => {
    setCourseData((prev) => {
      const subjects = [...prev.subjects];

      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        materials: [
          ...subjects[subjectIndex].materials,
          createMaterial(),
        ],
      };

      return {
        ...prev,
        subjects,
      };
    });
  };

  const removeMaterial = (subjectIndex, materialIndex) => {
    setCourseData((prev) => {
      const subjects = [...prev.subjects];

      subjects[subjectIndex] = {
        ...subjects[subjectIndex],
        materials: subjects[subjectIndex].materials.filter(
          (_, index) => index !== materialIndex
        ),
      };

      return {
        ...prev,
        subjects,
      };
    });
  };

  /* ---------------------------------------------------------
     Validation
  --------------------------------------------------------- */

  const isEmptyDescription = (value) => {
    if (!value) return true;

    const plainText = value
      .replace(/<(.|\n)*?>/g, "")
      .trim();

    return !plainText;
  };

  const validateCourse = () => {
    if (!courseData.name.trim()) {
      toast.error("Please enter a course name.");
      return false;
    }

    if (isEmptyDescription(courseData.description)) {
      toast.error("Please enter a course description.");
      return false;
    }

    if (!courseData.duration) {
      toast.error("Please enter the course duration.");
      return false;
    }

    if (!courseData.course_type) {
      toast.error("Please select a course type.");
      return false;
    }

    return true;
  };

  const validateSubjects = () => {
    if (!courseData.subjects.length) {
      toast.error("Please add at least one subject.");
      return false;
    }

    for (let i = 0; i < courseData.subjects.length; i++) {
      const subject = courseData.subjects[i];

      if (!subject.name.trim()) {
        toast.error(`Please enter Subject ${i + 1} name.`);
        return false;
      }

      if (isEmptyDescription(subject.description)) {
        toast.error(
          `Please enter Subject ${i + 1} description.`
        );
        return false;
      }

      if (!subject.duration) {
        toast.error(
          `Please enter Subject ${i + 1} duration.`
        );
        return false;
      }
    }

    return true;
  };

  const validateMaterials = () => {
    for (let i = 0; i < courseData.subjects.length; i++) {
      const subject = courseData.subjects[i];

      if (!subject.materials.length) {
        toast.error(
          `Please add at least one material to Subject ${i + 1}.`
        );
        return false;
      }

      for (let j = 0; j < subject.materials.length; j++) {
        const material = subject.materials[j];

        if (!material.name.trim()) {
          toast.error(
            `Please enter Material ${j + 1} name in Subject ${i + 1}.`
          );
          return false;
        }

        if (!material.content_type) {
          toast.error(
            `Please select content type for Material ${
              j + 1
            } in Subject ${i + 1}.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const validateStep = () => {
    if (activeTab === TABS.COURSE) return validateCourse();

    if (activeTab === TABS.SUBJECTS) return validateSubjects();

    if (activeTab === TABS.MATERIALS) return validateMaterials();

    return true;
  };

  /* ---------------------------------------------------------
     Navigation
  --------------------------------------------------------- */

  const goNext = () => {
    if (!validateStep()) return;

    if (currentStep < TAB_LIST.length - 1) {
      setActiveTab(TAB_LIST[currentStep + 1].id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const goPrevious = () => {
    if (currentStep > 0) {
      setActiveTab(TAB_LIST[currentStep - 1].id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const changeTab = (tabId) => {
    const targetIndex = TAB_LIST.findIndex(
      (tab) => tab.id === tabId
    );

    /*
      Don't allow jumping forward without completing
      the current step.
    */
    if (targetIndex > currentStep && !validateStep()) {
      return;
    }

    setActiveTab(tabId);
  };

  /* ---------------------------------------------------------
     Submit
  --------------------------------------------------------- */

  const generateJoinCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const first =
      letters[Math.floor(Math.random() * letters.length)];

    const second =
      letters[Math.floor(Math.random() * letters.length)];

    return `CCLMS-${first}${second}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateMaterials()) return;

    try {
      setSubmitting(true);

      const dataToSend = {
        ...courseData,
        join_code: courseId
          ? courseData.join_code
          : generateJoinCode(),
        created_by: authUser?.user,
      };

      if (courseId) {
        await axios.put(
          `/api/courses/update-course/${courseId}`,
          dataToSend
        );

        toast.success("Course updated successfully!");
      } else {
        await axios.post(
          "/api/courses/create-course",
          dataToSend
        );

        toast.success("Course created successfully!");
      }

      navigate("/instructor/courses");
    } catch (error) {
      console.error("Error submitting course:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to save course. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------
     Loading
  --------------------------------------------------------- */

  if (loading) {
    return (
      <div className="course-loading">
        <Spinner color="primary" />
        <p className="mt-3 mb-0">
          Loading course information...
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */

  return (
    <div className="course-form-page">

      {/* Saving Overlay */}
      {submitting && (
        <div className="course-overlay">
          <div className="saving-box">
            <Spinner color="primary" />
            <h6 className="mt-3 mb-1">
              {courseId
                ? "Updating course..."
                : "Creating course..."}
            </h6>
            <small className="text-muted">
              Please don't close this page.
            </small>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="course-page-header">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <button
              type="button"
              className="back-button"
              onClick={() =>
                navigate("/instructor/courses")
              }
            >
              <i className="bi bi-arrow-left" />
            </button>

            <h2 className="page-title mb-0">
              {courseId
                ? "Edit Course"
                : "Create New Course"}
            </h2>
          </div>

          <p className="text-muted mb-0">
            {courseId
              ? "Update your course information, subjects and learning materials."
              : "Create a complete course with subjects and learning materials."}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-card">

        <div className="step-progress">
          <div
            className="step-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="steps">
          {TAB_LIST.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isCompleted = index < currentStep;

            return (
              <button
                type="button"
                key={tab.id}
                className={classNames("step", {
                  active: isActive,
                  completed: isCompleted,
                })}
                onClick={() => changeTab(tab.id)}
              >
                <div className="step-icon">
                  {isCompleted ? (
                    <i className="bi bi-check-lg" />
                  ) : (
                    <i className={tab.icon} />
                  )}
                </div>

                <div className="step-content">
                  <small>
                    Step {index + 1}
                  </small>

                  <strong className="d-none d-sm-block">
                    {tab.title}
                  </strong>

                  <strong className="d-sm-none">
                    {tab.shortTitle}
                  </strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form */}
      <Form onSubmit={handleSubmit}>

        <div className="form-card">

          {/* ================= COURSE ================= */}
          {activeTab === TABS.COURSE && (
            <div className="form-section">

              <SectionHeader
                number="01"
                title="Course Information"
                description="Enter the basic information students will see about this course."
              />

              <Row>

                <Col lg="8">

                  <FormGroup>
                    <FieldLabel required>
                      Course Name
                    </FieldLabel>

                    <Input
                      type="text"
                      value={courseData.name}
                      placeholder="e.g. Full Stack Web Development"
                      onChange={(e) =>
                        updateCourseField(
                          "name",
                          e.target.value
                        )
                      }
                      disabled={submitting}
                      className="form-control-lg"
                    />

                    <small className="form-help">
                      Choose a clear and descriptive name.
                    </small>
                  </FormGroup>

                </Col>

                <Col lg="4">

                  <FormGroup>
                    <FieldLabel required>
                      Course Type
                    </FieldLabel>

                    <Input
                      type="select"
                      value={courseData.course_type}
                      onChange={(e) =>
                        updateCourseField(
                          "course_type",
                          e.target.value
                        )
                      }
                      disabled={submitting}
                      className="form-control-lg"
                    >
                      <option value="">
                        Select course type
                      </option>
                      <option value="public">
                        Public
                      </option>
                      <option value="private">
                        Private
                      </option>
                    </Input>
                  </FormGroup>

                </Col>

              </Row>

              <RichTextField
                label="Course Description"
                required
                value={courseData.description}
                onChange={(value) =>
                  updateCourseField(
                    "description",
                    value
                  )
                }
                placeholder="Explain what students will learn in this course..."
              />

              <Row>

                <Col md="6">

                  <FormGroup>
                    <FieldLabel required>
                      Course Duration
                    </FieldLabel>

                    <div className="input-group">
                      <Input
                        type="number"
                        min="1"
                        value={courseData.duration}
                        placeholder="e.g. 12"
                        onChange={(e) =>
                          updateCourseField(
                            "duration",
                            e.target.value
                          )
                        }
                        disabled={submitting}
                      />

                      <span className="input-group-text">
                        Months
                      </span>
                    </div>
                  </FormGroup>

                </Col>

                <Col md="6">

                  <FormGroup>
                    <FieldLabel>
                      Join Code
                    </FieldLabel>

                    <Input
                      type="text"
                      value={
                        courseData.join_code ||
                        "Generated automatically"
                      }
                      disabled
                    />

                    <small className="form-help">
                      A unique join code will be generated
                      when creating the course.
                    </small>
                  </FormGroup>

                </Col>

              </Row>

              {/* Image Section */}
              <div className="image-section">

                <div className="image-section-header">
                  <div>
                    <h5 className="mb-1">
                      Course Image
                    </h5>

                    <p className="text-muted small mb-0">
                      Add an image URL to represent your course.
                    </p>
                  </div>

                  <i className="bi bi-image fs-4 text-primary" />
                </div>

                <Row className="align-items-center">

                  <Col md="8">

                    <FormGroup className="mb-md-0">
                      <FieldLabel>
                        Image URL
                      </FieldLabel>

                      <Input
                        type="url"
                        value={courseData.imageUrl}
                        placeholder="https://example.com/course-image.jpg"
                        onChange={(e) =>
                          updateCourseField(
                            "imageUrl",
                            e.target.value
                          )
                        }
                        disabled={submitting}
                      />
                    </FormGroup>

                  </Col>

                  <Col md="4">

                    {courseData.imageUrl ? (
                      <div className="course-image-preview">
                        <img
                          src={courseData.imageUrl}
                          alt="Course preview"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="course-image-placeholder">
                        <i className="bi bi-image" />
                        <span>Preview</span>
                      </div>
                    )}

                  </Col>

                </Row>
              </div>

            </div>
          )}

          {/* ================= SUBJECTS ================= */}
          {activeTab === TABS.SUBJECTS && (
            <div className="form-section">

              <div className="section-header-row">

                <SectionHeader
                  number="02"
                  title="Course Subjects"
                  description="Break your course into structured subjects."
                />

                <Button
                  color="primary"
                  type="button"
                  onClick={addSubject}
                  disabled={submitting}
                  className="add-button btn-gradient"
                >
                  <i className="bi bi-plus-lg  text-white" />
                  Add
                </Button>

              </div>

              {courseData.subjects.map(
                (subject, index) => (
                  <SubjectCard
                    key={subject._id || index}
                    subject={subject}
                    index={index}
                    totalSubjects={
                      courseData.subjects.length
                    }
                    onChange={updateSubject}
                    onDelete={() =>
                      removeSubject(index)
                    }
                    disabled={submitting}
                  />
                )
              )}

              <div className="empty-add-box">
                <i className="bi bi-journal-plus" />

                <div>
                  <strong>
                    Need another subject?
                  </strong>

                  <p className="mb-0 text-muted small">
                    Add as many subjects as your course needs.
                  </p>
                </div>

                <Button
                  color="outline-primary"
                  size="xl"
                  type="button"
                  onClick={addSubject}
                  disabled={submitting}
                  className = "btn-gradient px-3"
                >
                  <i className="bi bi-plus-lg me-2 text-white" />
                  Add
                </Button>
              </div>

            </div>
          )}

          {/* ================= MATERIALS ================= */}
          {activeTab === TABS.MATERIALS && (
            <div className="form-section">

              <SectionHeader
                number="03"
                title="Learning Materials"
                description="Add PDFs, videos, documents or other resources for each subject."
              />

              {courseData.subjects.map(
                (subject, subjectIndex) => (
                  <div
                    key={subject._id || subjectIndex}
                    className="subject-material-section"
                  >

                    <div className="material-subject-header">

                      <div className="subject-heading-icon">
                        <i className="bi bi-journal-text" />
                      </div>

                      <div className="flex-grow-1">
                        <h5 className="mb-1">
                          {subject.name ||
                            `Subject ${
                              subjectIndex + 1
                            }`}
                        </h5>

                        <small className="text-muted">
                          {subject.materials.length}{" "}
                          {subject.materials.length === 1
                            ? "material"
                            : "materials"}
                        </small>
                      </div>

                      <Button
                        color="primary"
                        size="xl"
                        className="btn-gradient px-3"
                        type="button"
                        onClick={() =>
                          addMaterial(subjectIndex)
                        }
                        disabled={submitting}
                      >
                        <i className="bi bi-plus-lg me-1" />
                        Add
                        <span className="d-sm-none">
                          Add
                        </span>
                      </Button>

                    </div>

                    <div className="materials-grid">

                      {subject.materials.map(
                        (material, materialIndex) => (
                          <MaterialCard
                            key={
                              material._id ||
                              materialIndex
                            }
                            material={material}
                            subjectIndex={
                              subjectIndex
                            }
                            materialIndex={
                              materialIndex
                            }
                            totalMaterials={
                              subject.materials.length
                            }
                            onChange={
                              updateMaterial
                            }
                            onDelete={() =>
                              removeMaterial(
                                subjectIndex,
                                materialIndex
                              )
                            }
                            disabled={submitting}
                          />
                        )
                      )}

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="form-navigation">

          <Button
            type="button"
            color="light"
            onClick={
              currentStep === 0
                ? () =>
                    navigate(
                      "/instructor/courses"
                    )
                : goPrevious
            }
            disabled={submitting}
            className="navigation-button"
          >
            <i className="bi bi-arrow-left me-2" />

            {currentStep === 0
              ? "Cancel"
              : "Previous"}
          </Button>

          <div className="navigation-step">
            {currentStep + 1} / {TAB_LIST.length}
          </div>

          {currentStep < TAB_LIST.length - 1 ? (
            <Button
              type="button"
              color="primary"
              onClick={goNext}
              disabled={submitting}
              className="navigation-button btn-gradient"
            >
              Continue

              <i className="bi bi-arrow-right ms-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              color="success"
              disabled={submitting}
              className="navigation-button"
            >
              {submitting ? (
                <>
                  <Spinner
                    size="sm"
                    className="me-2"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2" />

                  {courseId
                    ? "Update Course"
                    : "Create Course"}
                </>
              )}
            </Button>
          )}

        </div>

      </Form>

      {/* Page Styles */}
      <style>{`

        /* =========================================
           PAGE
        ========================================= */

        .course-form-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 40px;
          color: #1f2937;
        }

        .course-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }

        .back-button {
          width: 36px;
          height: 36px;
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .back-button:hover {
          background: #f3f4f6;
        }

        /* =========================================
           STEPS
        ========================================= */

        .step-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 18px 20px 14px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .step-progress {
          height: 4px;
          background: #edf0f4;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 18px;
        }

        .step-progress-bar {
          height: 100%;
          background: #0d6efd;
          border-radius: 20px;
          transition: width 0.3s ease;
        }

        .steps {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .step {
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 4px;
          cursor: pointer;
          color: #9ca3af;
        }

        .step-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
          transition: 0.2s;
        }

        .step-content {
          display: flex;
          flex-direction: column;
        }

        .step-content small {
          font-size: 11px;
        }

        .step-content strong {
          font-size: 14px;
        }

        .step.active {
          color: #0d6efd;
        }

        .step.active .step-icon {
          background: #0d6efd;
          color: #fff;
        }

        .step.completed {
          color: #198754;
        }

        .step.completed .step-icon {
          background: #d1fae5;
          color: #198754;
        }

        /* =========================================
           FORM CARD
        ========================================= */

        .form-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          overflow: hidden;
        }

        .form-section {
          padding: 30px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .section-number {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #eff6ff;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }

        .section-header h4 {
          font-size: 20px;
          font-weight: 700;
        }

        .section-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        /* =========================================
           FORM ELEMENTS
        ========================================= */

        .form-label-custom {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          color: #374151;
        }

        .form-control,
        .form-select {
          border-color: #dfe3e8;
          border-radius: 8px;
          min-height: 42px;
          box-shadow: none !important;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #86b7fe;
        }

        .form-help {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #9ca3af;
        }

        .rich-editor {
          border-radius: 8px;
          overflow: hidden;
        }

        .rich-editor .ql-toolbar {
          border-color: #dfe3e8;
          background: #f8fafc;
        }

        .rich-editor .ql-container {
          border-color: #dfe3e8;
          min-height: 140px;
          font-size: 14px;
        }

        .rich-editor .ql-editor {
          min-height: 140px;
        }

        /* =========================================
           IMAGE
        ========================================= */

        .image-section {
          margin-top: 10px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          background: #fafbfc;
          border-radius: 12px;
        }

        .image-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .image-section-header h5 {
          font-size: 16px;
          font-weight: 650;
        }

        .course-image-preview,
        .course-image-placeholder {
          height: 120px;
          width: 100%;
          border-radius: 10px;
          border: 1px dashed #d1d5db;
          overflow: hidden;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .course-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .course-image-placeholder {
          flex-direction: column;
          color: #9ca3af;
          gap: 5px;
        }

        .course-image-placeholder i {
          font-size: 28px;
        }

        /* =========================================
           DYNAMIC CARDS
        ========================================= */

        .dynamic-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
        }

        .dynamic-card-header {
          padding: 16px 18px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dynamic-card-body {
          padding: 20px;
        }

        .item-number {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #e8f1ff;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .delete-button {
          width: 34px;
          height: 34px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
        }

        .add-button {
          white-space: nowrap;
        }

        .empty-add-box {
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 10px;
        }

        .empty-add-box > i {
          font-size: 24px;
          color: #0d6efd;
        }

        .empty-add-box div {
          flex: 1;
        }

        /* =========================================
           MATERIALS
        ========================================= */

        .subject-material-section {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 22px;
          overflow: hidden;
        }

        .material-subject-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .subject-heading-icon {
          width: 40px;
          height: 40px;
          background: #eff6ff;
          color: #0d6efd;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .materials-grid {
          padding: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .material-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }

        .material-header {
          padding: 13px 14px;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .material-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .material-body {
          padding: 18px;
        }

        /* =========================================
           NAVIGATION
        ========================================= */

        .form-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
          padding: 16px 20px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .navigation-button {
          min-width: 125px;
        }

        .navigation-step {
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
        }

        /* =========================================
           LOADING
        ========================================= */

        .course-loading {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .course-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .saving-box {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 30px 40px;
          text-align: center;
          box-shadow: 0 10px 35px rgba(0,0,0,0.12);
        }

        /* =========================================
           TABLET
        ========================================= */

        @media (max-width: 991px) {

          .materials-grid {
            grid-template-columns: 1fr;
          }

          .form-section {
            padding: 24px;
          }

        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 767px) {

          .course-form-page {
            padding: 12px 10px 90px;
          }

          .page-title {
            font-size: 21px;
          }

          .course-page-header {
            margin-bottom: 16px;
          }

          .step-card {
            padding: 14px 10px;
          }

          .steps {
            gap: 3px;
          }

          .step {
            flex-direction: column;
            justify-content: center;
            text-align: center;
            flex: 1;
          }

          .step-icon {
            width: 36px;
            height: 36px;
          }

          .step-content small {
            font-size: 10px;
          }

          .step-content strong {
            font-size: 11px;
          }

          .form-section {
            padding: 18px 14px;
          }

          .section-header h4 {
            font-size: 18px;
          }

          .section-header-row {
            flex-direction: column;
          }

          .section-header-row .add-button {
            width: 100%;
          }

          .dynamic-card-body {
            padding: 16px;
          }

          .dynamic-card-header {
            padding: 13px;
          }

          .empty-add-box {
            flex-wrap: wrap;
          }

          .empty-add-box button {
            width: 100%;
          }

          .material-subject-header {
            padding: 13px;
          }

          .materials-grid {
            padding: 12px;
            gap: 12px;
          }

          .material-body {
            padding: 14px;
          }

          .form-navigation {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            border-radius: 0;
            margin: 0;
            padding: 10px 12px;
            box-shadow: 0 -4px 15px rgba(0,0,0,0.08);
          }

          .navigation-button {
            min-width: 105px;
          }

          .navigation-step {
            font-size: 12px;
          }

          .image-section {
            padding: 15px;
          }

        }

        @media (max-width: 400px) {

          .navigation-button {
            min-width: auto;
            padding-left: 12px;
            padding-right: 12px;
          }

          .navigation-step {
            display: none;
          }

          .step-content strong {
            font-size: 10px;
          }

        }

      `}</style>
    </div>
  );
};

export default CourseForm;
