
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  Spinner,
} from "reactstrap";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { useAuthcontext } from "../../../contexts/Authcontext";

const TABS = {
  COURSE: "course",
  SUBJECTS: "subjects",
  MATERIALS: "materials",
};

const createEmptyMaterial = () => ({
  name: "",
  description: "",
  content_type: "",
  content_url: "",
});

const createEmptySubject = () => ({
  name: "",
  description: "",
  duration: "",
  materials: [createEmptyMaterial()],
});

const CourseForm = () => {
  const { authUser } = useAuthcontext();
  const { courseId } = useParams();
  const navigate = useNavigate();

  /* ============================================================
     STATE
  ============================================================ */

  const [activeTab, setActiveTab] = useState(TABS.COURSE);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Optional sections
  const [includeSubjects, setIncludeSubjects] = useState(false);
  const [includeMaterials, setIncludeMaterials] = useState(false);

  const [courseData, setCourseData] = useState({
    name: "",
    description: "",
    duration: "",
    imageUrl: "",
    course_type: "public",
    is_paidCourse: false,
    price: 0,
    currency: "INR",
    is_published: false,
    join_code: "",
    subjects: [],
    created_by:
      authUser?.user?._id ||
      authUser?.user ||
      "",
  });

  /* ============================================================
     DYNAMIC STEPS
  ============================================================ */

  const steps = [
    {
      id: TABS.COURSE,
      number: "01",
      title: "Course",
      description: "Basic information",
      icon: "bi bi-book",
    },

    ...(includeSubjects
      ? [
          {
            id: TABS.SUBJECTS,
            number: "02",
            title: "Subjects",
            description: "Course structure",
            icon: "bi bi-journal-text",
          },
        ]
      : []),

    ...(includeMaterials
      ? [
          {
            id: TABS.MATERIALS,
            number: includeSubjects ? "03" : "02",
            title: "Materials",
            description: "Learning content",
            icon: "bi bi-file-earmark-text",
          },
        ]
      : []),
  ];

  const currentStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeTab)
  );

  const progress =
    ((currentStepIndex + 1) / steps.length) * 100;

  /* ============================================================
     AUTH USER
  ============================================================ */

  useEffect(() => {
    if (!courseId && authUser?.user) {
      setCourseData((prev) => ({
        ...prev,
        created_by:
          authUser?.user?._id ||
          authUser?.user ||
          "",
      }));
    }
  }, [authUser, courseId]);

  /* ============================================================
     FETCH COURSE FOR EDIT
  ============================================================ */

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      setFetching(true);

      try {
        const response = await axios.get(
          `/api/courses/${courseId}`
        );

        const fetchedCourseData = response.data;

        const hasSubjects =
          Array.isArray(fetchedCourseData.subjects) &&
          fetchedCourseData.subjects.length > 0;

        let processedSubjects = [];

        if (hasSubjects) {
          processedSubjects = fetchedCourseData.subjects.map(
            (subject) => ({
              _id: subject?._id || "",
              name: subject?.name || "",
              description: subject?.description || "",
              duration: subject?.duration || "",

              materials: Array.isArray(subject?.materials)
                ? subject.materials.map((material) => ({
                    _id: material?._id || "",
                    name: material?.name || "",
                    description: material?.description || "",
                    content_type: material?.content_type || "",
                    content_url: material?.content_url || "",
                  }))
                : [],
            })
          );
        }

        const hasMaterials = processedSubjects.some(
          (subject) => subject.materials.length > 0
        );

        setIncludeSubjects(hasSubjects);
        setIncludeMaterials(hasMaterials);
        setActiveTab(TABS.COURSE);

        setCourseData({
          _id: fetchedCourseData?._id || "",
          name: fetchedCourseData?.name || "",
          description: fetchedCourseData?.description || "",
          duration: fetchedCourseData?.duration || "",
          imageUrl: fetchedCourseData?.imageUrl || "",

          course_type:
            fetchedCourseData?.course_type || "public",

          is_paidCourse:
            fetchedCourseData?.is_paidCourse === true,

          price: fetchedCourseData?.price ?? 0,
          currency: fetchedCourseData?.currency || "INR",

          is_published:
            fetchedCourseData?.is_published === true,

          join_code: fetchedCourseData?.join_code || "",

          subjects: processedSubjects,

          created_by:
            fetchedCourseData?.created_by?._id ||
            fetchedCourseData?.created_by ||
            authUser?.user?._id ||
            authUser?.user ||
            "",
        });
      } catch (error) {
        console.error("Error fetching course:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to load course data."
        );
      } finally {
        setFetching(false);
      }
    };

    fetchCourseData();

    // eslint-disable-next-line
  }, [courseId]);

  /* ============================================================
     COURSE CHANGE
  ============================================================ */

  const handleCourseChange = (field, value) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ============================================================
     SUBJECT CHANGE
  ============================================================ */

  const handleSubjectChange = (
    subjectIndex,
    field,
    value
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [...prev.subjects];

      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],
        [field]: value,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  /* ============================================================
     MATERIAL CHANGE
  ============================================================ */

  const handleMaterialChange = (
    subjectIndex,
    materialIndex,
    field,
    value
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [...prev.subjects];

      const updatedMaterials = [
        ...(updatedSubjects[subjectIndex]?.materials || []),
      ];

      updatedMaterials[materialIndex] = {
        ...updatedMaterials[materialIndex],
        [field]: value,
      };

      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],
        materials: updatedMaterials,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  /* ============================================================
     ENABLE OPTIONAL SUBJECTS
  ============================================================ */

  const enableSubjects = () => {
    setCourseData((prev) => ({
      ...prev,
      subjects: prev.subjects.length
        ? prev.subjects
        : [createEmptySubject()],
    }));

    setIncludeSubjects(true);
    setActiveTab(TABS.SUBJECTS);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ============================================================
     REMOVE OPTIONAL SUBJECTS
  ============================================================ */

  const disableSubjects = () => {
    setIncludeSubjects(false);
    setIncludeMaterials(false);
    setActiveTab(TABS.COURSE);
  };

  /* ============================================================
     ENABLE OPTIONAL MATERIALS
  ============================================================ */

  const enableMaterials = () => {
    if (!includeSubjects) {
      toast.error("Please add subjects first.");
      return;
    }

    setIncludeMaterials(true);
    setActiveTab(TABS.MATERIALS);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ============================================================
     REMOVE OPTIONAL MATERIALS
  ============================================================ */

  const disableMaterials = () => {
    setIncludeMaterials(false);

    if (activeTab === TABS.MATERIALS) {
      setActiveTab(TABS.SUBJECTS);
    }
  };

  /* ============================================================
     ADD SUBJECT
  ============================================================ */

  const addSubject = () => {
    setCourseData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        createEmptySubject(),
      ],
    }));
  };

  /* ============================================================
     REMOVE SUBJECT
  ============================================================ */

  const removeSubject = (subjectIndex) => {
    setCourseData((prev) => {
      const updatedSubjects = prev.subjects.filter(
        (_, index) => index !== subjectIndex
      );

      if (updatedSubjects.length === 0) {
        setIncludeSubjects(false);
        setIncludeMaterials(false);
        setActiveTab(TABS.COURSE);
      }

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  /* ============================================================
     ADD MATERIAL
  ============================================================ */

  const addMaterial = (subjectIndex) => {
    setCourseData((prev) => {
      const updatedSubjects = [...prev.subjects];

      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],

        materials: [
          ...(updatedSubjects[subjectIndex]?.materials || []),
          createEmptyMaterial(),
        ],
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  /* ============================================================
     REMOVE MATERIAL
  ============================================================ */

  const removeMaterial = (
    subjectIndex,
    materialIndex
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [...prev.subjects];

      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],

        materials: (
          updatedSubjects[subjectIndex]?.materials || []
        ).filter((_, index) => index !== materialIndex),
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  /* ============================================================
     GENERATE JOIN CODE
  ============================================================ */

  const generateJoinCode = () => {
    const getRandomLetter = () =>
      String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      );

    const uniqueSuffix =
      getRandomLetter() + getRandomLetter();

    return `NCL1-${uniqueSuffix}`;
  };

  /* ============================================================
     VALIDATE COURSE DETAILS
  ============================================================ */

  const validateCourseDetails = () => {
    if (!courseData.name.trim()) {
      toast.error("Course name is required");
      setActiveTab(TABS.COURSE);
      return false;
    }

    const plainDescription = courseData.description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (!plainDescription) {
      toast.error("Course description is required");
      setActiveTab(TABS.COURSE);
      return false;
    }

    if (
      !courseData.duration ||
      Number(courseData.duration) <= 0
    ) {
      toast.error("Please enter a valid course duration");
      setActiveTab(TABS.COURSE);
      return false;
    }

    if (!courseData.course_type) {
      toast.error("Please select course type");
      setActiveTab(TABS.COURSE);
      return false;
    }

    if (
      courseData.is_paidCourse &&
      (
        courseData.price === "" ||
        Number(courseData.price) <= 0
      )
    ) {
      toast.error("Please enter a valid price");
      setActiveTab(TABS.COURSE);
      return false;
    }

    return true;
  };

  /* ============================================================
     VALIDATE SUBJECTS
  ============================================================ */

  const validateSubjects = () => {
    if (!includeSubjects) return true;

    if (
      !Array.isArray(courseData.subjects) ||
      courseData.subjects.length === 0
    ) {
      toast.error("Please add at least one subject");
      setActiveTab(TABS.SUBJECTS);
      return false;
    }

    for (let i = 0; i < courseData.subjects.length; i++) {
      const subject = courseData.subjects[i];

      if (!subject.name?.trim()) {
        toast.error(
          `Subject ${i + 1} name is required`
        );

        setActiveTab(TABS.SUBJECTS);
        return false;
      }

      if (
        !subject.duration ||
        Number(subject.duration) <= 0
      ) {
        toast.error(
          `Please enter a valid duration for subject ${i + 1}`
        );

        setActiveTab(TABS.SUBJECTS);
        return false;
      }
    }

    return true;
  };

  /* ============================================================
     VALIDATE MATERIALS
  ============================================================ */

  const validateMaterials = () => {
    if (!includeMaterials) return true;

    const allMaterials = courseData.subjects.flatMap(
      (subject) => subject.materials || []
    );

    if (allMaterials.length === 0) {
      toast.error("Please add at least one learning material");
      setActiveTab(TABS.MATERIALS);
      return false;
    }

    for (let i = 0; i < courseData.subjects.length; i++) {
      const subject = courseData.subjects[i];

      for (
        let j = 0;
        j < (subject.materials || []).length;
        j++
      ) {
        const material = subject.materials[j];

        if (!material.name?.trim()) {
          toast.error(
            `Material ${j + 1} name is required in ${subject.name}`
          );

          setActiveTab(TABS.MATERIALS);
          return false;
        }

        if (!material.content_type) {
          toast.error(
            `Please select content type for material ${j + 1}`
          );

          setActiveTab(TABS.MATERIALS);
          return false;
        }

        if (!material.content_url?.trim()) {
          toast.error(
            `Please enter content URL for material ${j + 1}`
          );

          setActiveTab(TABS.MATERIALS);
          return false;
        }
      }
    }

    return true;
  };

  /* ============================================================
     COMPLETE VALIDATION
  ============================================================ */

  const validateCourse = () => {
    if (!validateCourseDetails()) return false;

    if (!validateSubjects()) return false;

    if (!validateMaterials()) return false;

    return true;
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateCourse()) {
      return;
    }

    setLoading(true);

    try {
      const cleanedSubjects = includeSubjects
        ? courseData.subjects.map((subject) => ({
            ...(subject._id
              ? { _id: subject._id }
              : {}),

            name: subject.name.trim(),
            description: subject.description || "",
            duration: Number(subject.duration),

            materials: includeMaterials
              ? (subject.materials || []).map(
                  (material) => ({
                    ...(material._id
                      ? { _id: material._id }
                      : {}),

                    name: material.name.trim(),
                    description: material.description || "",
                    content_type: material.content_type,
                    content_url: material.content_url,
                  })
                )
              : [],
          }))
        : [];

      const payload = {
        name: courseData.name.trim(),

        description: courseData.description,

        duration: Number(courseData.duration),

        imageUrl: courseData.imageUrl || "",

        course_type: courseData.course_type,

        is_paidCourse: Boolean(
          courseData.is_paidCourse
        ),

        price: courseData.is_paidCourse
          ? Number(courseData.price)
          : 0,

        currency: courseData.currency || "INR",

        is_published: Boolean(
          courseData.is_published
        ),

        join_code:
          courseData.join_code || generateJoinCode(),

        subjects: cleanedSubjects,

        created_by:
          courseData.created_by ||
          authUser?.user?._id ||
          authUser?.user ||
          null,
      };

      if (courseId) {
        await axios.put(
          `/api/courses/update-course/${courseId}`,
          payload
        );

        toast.success("Course updated successfully!");
      } else {
        await axios.post(
          "/api/courses/create-course",
          payload
        );

        toast.success("Course created successfully!");
      }

      navigate("/teacher/courses");
    } catch (error) {
      console.error("Error submitting course:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Error submitting form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     STEP NAVIGATION
  ============================================================ */

  const goToStep = (step) => {
    if (!steps.some((item) => item.id === step)) return;

    setActiveTab(step);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goNext = () => {
    if (activeTab === TABS.COURSE) {
      if (!validateCourseDetails()) return;
    }

    if (activeTab === TABS.SUBJECTS) {
      if (!validateSubjects()) return;
    }

    const nextIndex = currentStepIndex + 1;

    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].id);
    }
  };

  const goPrevious = () => {
    const previousIndex = currentStepIndex - 1;

    if (previousIndex >= 0) {
      goToStep(steps[previousIndex].id);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (fetching) {
    return (
      <div className="course-loading">
        <Spinner />

        <div className="mt-3">
          Loading course data...
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="course-form-page">

      {/* PAGE HEADER */}

      <div className="course-page-header">
        <div>
          <h1 className="page-title mb-1">
            {courseId ? "Edit Course" : "Create Course"}
          </h1>

          <span className="text-muted">
            {courseId
              ? "Update your course information and learning content."
              : "Create a course with optional subjects and learning materials."}
          </span>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/teacher/courses")}
          title="Back to Courses"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
      </div>

      {/* STEP CARD */}

      <div className="step-card">
        <div className="step-progress">
          <div
            className="step-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="steps">
          {steps.map((step, index) => {
            const isActive = activeTab === step.id;
            const isCompleted = index < currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                className={`step ${
                  isActive ? "active" : ""
                } ${
                  isCompleted ? "completed" : ""
                }`}
                onClick={() => goToStep(step.id)}
              >
                <div className="step-icon">
                  <i
                    className={
                      isCompleted
                        ? "bi bi-check-lg"
                        : step.icon
                    }
                  ></i>
                </div>

                <div className="step-content">
                  <small>Step {step.number}</small>
                  <strong>{step.title}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORM CARD */}

      <div className="form-card">
        <Form onSubmit={handleSubmit}>

          {/* ======================================================
              STEP 1 - COURSE
          ====================================================== */}

          {activeTab === TABS.COURSE && (
            <div className="form-section">

              <div className="section-header-row">
                <div className="section-header">
                  <div className="section-number">01</div>

                  <div>
                    <h4 className="mb-1">
                      Course Information
                    </h4>

                    <span className="form-help">
                      Add the basic information and settings for your course.
                    </span>
                  </div>
                </div>
              </div>

              {/* BASIC INFORMATION */}

              <Row>
                <Col xs="12" md="8">
                  <FormGroup>
                    <Label className="form-label-custom">
                      Course Name
                    </Label>

                    <Input
                      className="form-control"
                      type="text"
                      value={courseData.name}
                      placeholder="Enter course name"
                      onChange={(e) =>
                        handleCourseChange("name", e.target.value)
                      }
                      required
                    />
                  </FormGroup>
                </Col>

                <Col xs="12" md="4">
                  <FormGroup>
                    <Label className="form-label-custom">
                      Duration
                    </Label>

                    <Input
                      className="form-control"
                      type="number"
                      min="1"
                      value={courseData.duration}
                      placeholder="Months"
                      onChange={(e) =>
                        handleCourseChange("duration", e.target.value)
                      }
                      required
                    />

                    <small className="form-help">
                      Course duration in months.
                    </small>
                  </FormGroup>
                </Col>
              </Row>

              {/* DESCRIPTION */}

              <FormGroup>
                <Label className="form-label-custom">
                  Course Description
                </Label>

                <div className="rich-editor">
                  <ReactQuill
                    value={courseData.description}
                    onChange={(value) =>
                      handleCourseChange("description", value)
                    }
                    modules={{
                      toolbar: [
                        [
                          {
                            header: [1, 2, false],
                          },
                        ],
                        [
                          "bold",
                          "italic",
                          "underline",
                          "strike",
                          "blockquote",
                        ],
                        [
                          { list: "ordered" },
                          { list: "bullet" },
                        ],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                  />
                </div>
              </FormGroup>

              {/* IMAGE */}

              <div className="image-section">
                <div className="image-section-header">
                  <div>
                    <h5 className="mb-1">
                      Course Image
                    </h5>

                    <small className="form-help">
                      Add an image URL for the course.
                    </small>
                  </div>
                </div>

                <FormGroup>
                  <Input
                    className="form-control"
                    type="url"
                    value={courseData.imageUrl}
                    placeholder="https://example.com/course-image.jpg"
                    onChange={(e) =>
                      handleCourseChange("imageUrl", e.target.value)
                    }
                  />
                </FormGroup>

                {courseData.imageUrl ? (
                  <div className="course-image-preview">
                    <img
                      src={courseData.imageUrl}
                      alt="Course Preview"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="course-image-placeholder">
                    <i className="bi bi-image"></i>
                    <span>No image preview</span>
                  </div>
                )}
              </div>

              {/* VISIBILITY + PRICING */}

              <Row className="mt-4">
                <Col xs="12" md="6">
                  <FormGroup>
                    <Label className="form-label-custom">
                      Course Visibility
                    </Label>

                    <Input
                      className="form-select"
                      type="select"
                      value={courseData.course_type}
                      onChange={(e) =>
                        handleCourseChange("course_type", e.target.value)
                      }
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </Input>

                    <small className="form-help">
                      {courseData.course_type === "private"
                        ? "Students must request access before joining."
                        : "Students can discover this course directly."}
                    </small>
                  </FormGroup>
                </Col>

                <Col xs="12" md="6">
                  <FormGroup>
                    <Label className="form-label-custom">
                      Pricing
                    </Label>

                    <Input
                      className="form-select"
                      type="select"
                      value={
                        courseData.is_paidCourse ? "paid" : "free"
                      }
                      onChange={(e) => {
                        const isPaid = e.target.value === "paid";

                        handleCourseChange("is_paidCourse", isPaid);

                        if (!isPaid) {
                          handleCourseChange("price", 0);
                        }
                      }}
                    >
                      <option value="free">Free Course</option>
                      <option value="paid">Paid Course</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {/* PAID COURSE */}

              {courseData.is_paidCourse && (
                <div className="dynamic-card mb-4">
                  <div className="dynamic-card-header">
                    <div>
                      <strong>Course Pricing</strong>

                      <small className="form-help">
                        Set the price students need to pay.
                      </small>
                    </div>
                  </div>

                  <div className="dynamic-card-body">
                    <Row>
                      <Col xs="12" md="8">
                        <FormGroup>
                          <Label className="form-label-custom">
                            Price
                          </Label>

                          <Input
                            className="form-control"
                            type="number"
                            min="1"
                            step="0.01"
                            value={courseData.price}
                            placeholder="Enter price"
                            onChange={(e) =>
                              handleCourseChange("price", e.target.value)
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col xs="12" md="4">
                        <FormGroup>
                          <Label className="form-label-custom">
                            Currency
                          </Label>

                          <Input
                            className="form-select"
                            type="select"
                            value={courseData.currency}
                            onChange={(e) =>
                              handleCourseChange("currency", e.target.value)
                            }
                          >
                            <option value="INR">INR ₹</option>
                            <option value="USD">USD $</option>
                            <option value="EUR">EUR €</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                </div>
              )}

              {/* PUBLISH */}

              <div className="dynamic-card mb-4">
                <div className="dynamic-card-header">
                  <div>
                    <strong>Publication</strong>

                    <small className="form-help">
                      Decide whether students can see this course.
                    </small>
                  </div>
                </div>

                <div className="dynamic-card-body">
                  <div className="d-flex align-items-center gap-3">
                    <Input
                      type="checkbox"
                      style={{
                        width: "18px",
                        height: "18px",
                      }}
                      checked={courseData.is_published}
                      onChange={(e) =>
                        handleCourseChange(
                          "is_published",
                          e.target.checked
                        )
                      }
                    />

                    <div>
                      <strong>
                        {courseData.is_published
                          ? "Published"
                          : "Draft"}
                      </strong>

                      <div className="form-help">
                        {courseData.is_published
                          ? "This course is published."
                          : "This course is saved as a draft."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* JOIN CODE */}

              <div className="dynamic-card">
                <div className="dynamic-card-header">
                  <div>
                    <strong>Course Join Code</strong>

                    <small className="form-help">
                      Used for course access requests.
                    </small>
                  </div>
                </div>

                <div className="dynamic-card-body">
                  <Input
                    className="form-control"
                    type="text"
                    value={courseData.join_code}
                    placeholder="Generated automatically"
                    readOnly
                  />

                  <small className="form-help">
                    A join code is generated automatically when the course is created.
                  </small>
                </div>
              </div>

              {/* ==================================================
                  OPTIONAL SUBJECTS AND MATERIALS
              ================================================== */}

              <div className="dynamic-card mt-4">

                <div className="dynamic-card-header">
                  <div>
                    <strong>
                      Additional Course Content
                    </strong>

                    <small className="form-help">
                      Subjects and learning materials are optional.
                      You can create a course with basic details alone.
                    </small>
                  </div>
                </div>

                <div className="dynamic-card-body">

                  {/* SUBJECT OPTION */}

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-2">

                    <div>
                      <strong>
                        <i className="bi bi-journal-text me-2"></i>
                        Course Subjects
                      </strong>

                      <div className="form-help">
                        Organize your course into subjects or modules.
                      </div>
                    </div>

                    {!includeSubjects ? (
                      <Button
                        color="primary"
                        outline
                        type="button"
                        onClick={enableSubjects}
                      >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Subjects (Optional)
                      </Button>
                    ) : (
                      <Button
                        color="danger"
                        outline
                        type="button"
                        onClick={disableSubjects}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Remove Subjects
                      </Button>
                    )}

                  </div>

                  <hr />

                  {/* MATERIAL OPTION */}

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-2">

                    <div>
                      <strong>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Learning Materials
                      </strong>

                      <div className="form-help">
                        Add PDFs, videos, documents, images and links.
                      </div>
                    </div>

                    {!includeMaterials ? (
                      <Button
                        color="success"
                        outline
                        type="button"
                        disabled={!includeSubjects}
                        onClick={enableMaterials}
                      >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Materials (Optional)
                      </Button>
                    ) : (
                      <Button
                        color="danger"
                        outline
                        type="button"
                        onClick={disableMaterials}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Remove Materials
                      </Button>
                    )}

                  </div>

                  {!includeSubjects && (
                    <small className="form-help d-block mt-2">
                      Add subjects first to enable learning materials.
                    </small>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* ======================================================
              STEP 2 - SUBJECTS
          ====================================================== */}

          {activeTab === TABS.SUBJECTS && includeSubjects && (
            <div className="form-section">

              <div className="section-header-row">

                <div className="section-header">
                  <div className="section-number">02</div>

                  <div>
                    <h4 className="mb-1">
                      Course Subjects
                    </h4>

                    <span className="form-help">
                      Organize your course into subjects or modules.
                    </span>
                  </div>
                </div>

                <Button
                  color="primary"
                  type="button"
                  className="add-button"
                  onClick={addSubject}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Add Subject
                </Button>

              </div>

              {courseData.subjects.length === 0 ? (
                <div className="empty-add-box">
                  <i className="bi bi-journal-plus"></i>

                  <div>
                    <strong>No subjects added</strong>

                    <small className="form-help">
                      Add your first subject to start building the course.
                    </small>
                  </div>

                  <Button
                    color="primary"
                    type="button"
                    onClick={addSubject}
                  >
                    Add Subject
                  </Button>
                </div>
              ) : (
                courseData.subjects.map((subject, subjectIndex) => (
                  <div
                    className="dynamic-card mb-4"
                    key={subject._id || subjectIndex}
                  >

                    <div className="dynamic-card-header">

                      <div className="d-flex align-items-center gap-3">

                        <div className="item-number">
                          {String(subjectIndex + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <strong>
                            {subject.name ||
                              `Subject ${subjectIndex + 1}`}
                          </strong>

                          <small className="form-help">
                            Subject information
                          </small>
                        </div>

                      </div>

                      <Button
                        type="button"
                        color="light"
                        className="delete-button"
                        onClick={() => removeSubject(subjectIndex)}
                        title="Remove subject"
                      >
                        <i className="bi bi-trash text-danger"></i>
                      </Button>

                    </div>

                    <div className="dynamic-card-body">

                      <Row>

                        <Col xs="12" md="8">
                          <FormGroup>
                            <Label className="form-label-custom">
                              Subject Name
                            </Label>

                            <Input
                              className="form-control"
                              type="text"
                              value={subject.name}
                              placeholder="Enter subject name"
                              onChange={(e) =>
                                handleSubjectChange(
                                  subjectIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </FormGroup>
                        </Col>

                        <Col xs="12" md="4">
                          <FormGroup>
                            <Label className="form-label-custom">
                              Duration
                            </Label>

                            <Input
                              className="form-control"
                              type="number"
                              min="1"
                              value={subject.duration}
                              placeholder="Months"
                              onChange={(e) =>
                                handleSubjectChange(
                                  subjectIndex,
                                  "duration",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </FormGroup>
                        </Col>

                      </Row>

                      <FormGroup>
                        <Label className="form-label-custom">
                          Subject Description
                        </Label>

                        <div className="rich-editor">
                          <ReactQuill
                            value={subject.description}
                            onChange={(value) =>
                              handleSubjectChange(
                                subjectIndex,
                                "description",
                                value
                              )
                            }
                          />
                        </div>
                      </FormGroup>

                    </div>
                  </div>
                ))
              )}

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">

                <Button
                  color="danger"
                  outline
                  type="button"
                  onClick={disableSubjects}
                >
                  <i className="bi bi-trash me-1"></i>
                  Remove Subjects Section
                </Button>

                {!includeMaterials && (
                  <Button
                    color="success"
                    outline
                    type="button"
                    onClick={enableMaterials}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Add Materials (Optional)
                  </Button>
                )}

              </div>

            </div>
          )}

          {/* ======================================================
              STEP 3 - MATERIALS
          ====================================================== */}

          {activeTab === TABS.MATERIALS && includeMaterials && (
            <div className="form-section">

              <div className="section-header-row">

                <div className="section-header">
                  <div className="section-number">
                    {includeSubjects ? "03" : "02"}
                  </div>

                  <div>
                    <h4 className="mb-1">
                      Learning Materials
                    </h4>

                    <span className="form-help">
                      Add videos, PDFs, documents, images and links.
                    </span>
                  </div>
                </div>

              </div>

              {courseData.subjects.map((subject, subjectIndex) => (
                <div
                  className="subject-material-section"
                  key={subject._id || subjectIndex}
                >

                  {/* SUBJECT HEADER */}

                  <div className="material-subject-header">

                    <div className="subject-heading-icon">
                      <i className="bi bi-journal-text"></i>
                    </div>

                    <div>
                      <strong>
                        {subject.name ||
                          `Subject ${subjectIndex + 1}`}
                      </strong>

                      <small className="form-help">
                        {subject.materials?.length || 0} material(s)
                      </small>
                    </div>

                  </div>

                  {/* MATERIALS */}

                  <div className="materials-grid">

                    {(subject.materials || []).map(
                      (material, materialIndex) => (
                        <div
                          className="material-card"
                          key={material._id || materialIndex}
                        >

                          {/* MATERIAL HEADER */}

                          <div className="material-header">

                            <div className="d-flex align-items-center gap-2">

                              <div className="material-icon">
                                <i className="bi bi-file-earmark-text"></i>
                              </div>

                              <strong>
                                Material {materialIndex + 1}
                              </strong>

                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                removeMaterial(
                                  subjectIndex,
                                  materialIndex
                                )
                              }
                              title="Remove material"
                            >
                              <i className="bi bi-trash"></i>
                            </button>

                          </div>

                          {/* MATERIAL BODY */}

                          <div className="material-body">

                            <FormGroup>
                              <Label className="form-label-custom">
                                Material Name
                              </Label>

                              <Input
                                className="form-control"
                                type="text"
                                value={material.name}
                                placeholder="Enter material name"
                                onChange={(e) =>
                                  handleMaterialChange(
                                    subjectIndex,
                                    materialIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </FormGroup>

                            <FormGroup>
                              <Label className="form-label-custom">
                                Description
                              </Label>

                              <Input
                                className="form-control"
                                type="textarea"
                                rows="3"
                                value={material.description}
                                placeholder="Enter material description"
                                onChange={(e) =>
                                  handleMaterialChange(
                                    subjectIndex,
                                    materialIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </FormGroup>

                            <FormGroup>
                              <Label className="form-label-custom">
                                Content Type
                              </Label>

                              <Input
                                className="form-select"
                                type="select"
                                value={material.content_type}
                                onChange={(e) =>
                                  handleMaterialChange(
                                    subjectIndex,
                                    materialIndex,
                                    "content_type",
                                    e.target.value
                                  )
                                }
                                required
                              >
                                <option value="">
                                  Select Content Type
                                </option>

                                <option value="PDF">
                                  PDF
                                </option>

                                <option value="Video">
                                  Video
                                </option>

                                <option value="Document">
                                  Document
                                </option>

                                <option value="Image">
                                  Image
                                </option>

                                <option value="Link">
                                  Link
                                </option>
                              </Input>
                            </FormGroup>

                            <FormGroup>
                              <Label className="form-label-custom">
                                Content URL
                              </Label>

                              <Input
                                className="form-control"
                                type="url"
                                value={material.content_url}
                                placeholder="https://..."
                                onChange={(e) =>
                                  handleMaterialChange(
                                    subjectIndex,
                                    materialIndex,
                                    "content_url",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </FormGroup>

                          </div>
                        </div>
                      )
                    )}

                  </div>

                  {/* ADD MATERIAL */}

                  <div className="px-3 pb-3">
                    <Button
                      type="button"
                      color="light"
                      className="w-100 add-button"
                      onClick={() => addMaterial(subjectIndex)}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Add Material
                    </Button>
                  </div>

                </div>
              ))}

              <div className="mt-3">
                <Button
                  color="danger"
                  outline
                  type="button"
                  onClick={disableMaterials}
                >
                  <i className="bi bi-trash me-1"></i>
                  Remove Materials Section
                </Button>
              </div>

            </div>
          )}

        </Form>
      </div>

      {/* ==========================================================
          NAVIGATION
      ========================================================== */}

      <div className="form-navigation">

        <div>
          {currentStepIndex > 0 && (
            <Button
              color="light"
              type="button"
              className="navigation-button"
              onClick={goPrevious}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Previous
            </Button>
          )}
        </div>

        <div className="navigation-step">
          Step {currentStepIndex + 1} of {steps.length}
        </div>

        <div>

          {currentStepIndex < steps.length - 1 ? (
            <Button
              color="primary"
              type="button"
              className="navigation-button btn-gradient"
              onClick={goNext}
            >
              Next
              <i className="bi bi-arrow-right ms-1"></i>
            </Button>
          ) : (
            <Button
              color="success"
              type="button"
              className="navigation-button"
              disabled={loading}
              onClick={() => {
                const form = document.querySelector(
                  ".course-form-page form"
                );

                if (form) {
                  form.requestSubmit();
                }
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>

                  {courseId
                    ? "Update Course"
                    : "Create Course"}
                </>
              )}
            </Button>
          )}

        </div>

      </div>

      {/* SAVING OVERLAY */}

      {loading && (
        <div className="course-overlay">
          <div className="saving-box">
            <Spinner />

            <h5 className="mt-3 mb-1">
              {courseId ? "Updating Course" : "Creating Course"}
            </h5>

            <p className="text-muted mb-0">
              Please wait while your course is being saved.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseForm;
