import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  TabContent,
  TabPane,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
} from "reactstrap";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { useAuthcontext } from "../../../contexts/Authcontext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faLayerGroup,
  faFolderOpen,
  faPlus,
  faTrash,
  faImage,
  faLink,
  faArrowRight,
  faArrowLeft,
  faCheck,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

const TABS = {
  COURSE: "course",
  SUBJECTS: "subjects",
  MATERIALS: "materials",
};

const CourseForm = () => {
  const { authUser } = useAuthcontext();

  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS.COURSE);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [courseData, setCourseData] = useState({
    name: "",
    description: "",
    duration: "",
    imageUrl: "",
    course_type: "",
    join_code: "",

    subjects: [
      {
        name: "",
        description: "",
        duration: "",
        materials: [
          {
            name: "",
            description: "",
            content_type: "",
            content_url: "",
          },
        ],
      },
    ],

    created_by: authUser?.user,
  });

  /* =====================================================
     FETCH COURSE
  ===================================================== */

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      setLoading(true);

      try {
        const response = await axios.get(
          `/api/courses/${courseId}`
        );

        const fetchedCourseData = response.data;

        const processedData = {
          name: fetchedCourseData.name || "",
          description: fetchedCourseData.description || "",
          duration: fetchedCourseData.duration || "",
          imageUrl: fetchedCourseData.imageUrl || "",
          course_type:
            fetchedCourseData.course_type || "public",
          join_code: fetchedCourseData.join_code || "",

          subjects: (
            Array.isArray(fetchedCourseData.subjects)
              ? fetchedCourseData.subjects
              : []
          ).map((subject) => ({
            _id: subject._id || "",
            name: subject.name || "",
            description: subject.description || "",
            duration: subject.duration || "",

            materials:
              Array.isArray(subject.materials) &&
              subject.materials.length > 0
                ? subject.materials.map((material) => ({
                    _id: material._id || "",
                    name: material.name || "",
                    description:
                      material.description || "",
                    content_type:
                      material.content_type || "",
                    content_url:
                      material.content_url || "",
                  }))
                : [
                    {
                      name: "",
                      description: "",
                      content_type: "",
                      content_url: "",
                    },
                  ],
          })),
        };

        if (processedData.subjects.length === 0) {
          processedData.subjects = [
            {
              name: "",
              description: "",
              duration: "",
              materials: [
                {
                  name: "",
                  description: "",
                  content_type: "",
                  content_url: "",
                },
              ],
            },
          ];
        }

        setCourseData(processedData);
      } catch (error) {
        console.error(
          "Error fetching course:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to load course data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);


  /* =====================================================
     HELPERS
  ===================================================== */

  const isDescriptionEmpty = (value) => {
    if (!value) return true;

    const text = value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    return text.length === 0;
  };


  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateCourse = () => {
    if (!courseData.name.trim()) {
      toast.error("Please enter a course name.");
      setActiveTab(TABS.COURSE);
      return false;
    }

    if (!courseData.course_type) {
      toast.error("Please select a course type.");
      setActiveTab(TABS.COURSE);
      return false;
    }

    if (
      !courseData.duration ||
      Number(courseData.duration) < 1
    ) {
      toast.error("Please enter the course duration.");
      setActiveTab(TABS.COURSE);
      return false;
    }

    if (isDescriptionEmpty(courseData.description)) {
      toast.error("Please enter a course description.");
      setActiveTab(TABS.COURSE);
      return false;
    }

    return true;
  };


  const validateSubjects = () => {
    for (
      let subjectIndex = 0;
      subjectIndex < courseData.subjects.length;
      subjectIndex++
    ) {
      const subject =
        courseData.subjects[subjectIndex];

      if (!subject.name.trim()) {
        toast.error(
          `Please enter Subject ${
            subjectIndex + 1
          } name.`
        );

        setActiveTab(TABS.SUBJECTS);

        return false;
      }

      if (
        !subject.duration ||
        Number(subject.duration) < 1
      ) {
        toast.error(
          `Please enter duration for Subject ${
            subjectIndex + 1
          }.`
        );

        setActiveTab(TABS.SUBJECTS);

        return false;
      }
    }

    return true;
  };


  const validateMaterials = () => {
    for (
      let subjectIndex = 0;
      subjectIndex < courseData.subjects.length;
      subjectIndex++
    ) {
      const subject =
        courseData.subjects[subjectIndex];

      for (
        let materialIndex = 0;
        materialIndex < subject.materials.length;
        materialIndex++
      ) {
        const material =
          subject.materials[materialIndex];

        if (!material.name.trim()) {
          toast.error(
            `Please enter Material ${
              materialIndex + 1
            } name in Subject ${
              subjectIndex + 1
            }.`
          );

          setActiveTab(TABS.MATERIALS);

          return false;
        }

        if (!material.content_type) {
          toast.error(
            `Please select content type for Material ${
              materialIndex + 1
            }.`
          );

          setActiveTab(TABS.MATERIALS);

          return false;
        }

        if (!material.content_url.trim()) {
          toast.error(
            `Please enter content URL for Material ${
              materialIndex + 1
            }.`
          );

          setActiveTab(TABS.MATERIALS);

          return false;
        }
      }
    }

    return true;
  };


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    /*
      IMPORTANT:
      noValidate is used on the Form because fields
      from other tabs are hidden. Browser native
      validation cannot focus hidden inputs.
    */

    if (!validateCourse()) return;

    if (!validateSubjects()) return;

    if (!validateMaterials()) return;

    setSaving(true);

    try {
      if (courseId) {
        await axios.put(
          `/api/courses/update-course/${courseId}`,
          courseData
        );

        toast.success(
          "Course updated successfully!"
        );
      } else {
        const getRandomLetter = () =>
          String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
          );

        const uniqueSuffix =
          getRandomLetter() +
          getRandomLetter();

        const generatedJoinCode =
          `NCL1-${uniqueSuffix}`;

        await axios.post(
          "/api/courses/create-course",
          {
            ...courseData,
            join_code: generatedJoinCode,
            created_by: authUser?.user,
          }
        );

        toast.success(
          "Course created successfully!"
        );
      }

      navigate("/teacher/courses");

    } catch (error) {
      console.error(
        "Error submitting course form:",
        error
      );

      const errorMessage =
        error.response?.data?.message ||
        "Error submitting form. Please try again.";

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };


  /* =====================================================
     COURSE CHANGE
  ===================================================== */

  const handleCourseChange = (
    field,
    value
  ) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  /* =====================================================
     SUBJECT CHANGE
  ===================================================== */

  const handleSubjectChange = (
    index,
    field,
    value
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [...prev.subjects];

      updatedSubjects[index] = {
        ...updatedSubjects[index],
        [field]: value,
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };


  /* =====================================================
     MATERIAL CHANGE
  ===================================================== */

  const handleMaterialChange = (
    subjectIndex,
    materialIndex,
    field,
    value
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [...prev.subjects];

      const updatedMaterials = [
        ...updatedSubjects[subjectIndex]
          .materials,
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


  /* =====================================================
     ADD SUBJECT
  ===================================================== */

  const addSubject = () => {
    setCourseData((prev) => ({
      ...prev,

      subjects: [
        ...prev.subjects,

        {
          name: "",
          description: "",
          duration: "",

          materials: [
            {
              name: "",
              description: "",
              content_type: "",
              content_url: "",
            },
          ],
        },
      ],
    }));
  };


  /* =====================================================
     REMOVE SUBJECT
  ===================================================== */

  const removeSubject = (
    subjectIndex
  ) => {
    setCourseData((prev) => ({
      ...prev,

      subjects: prev.subjects.filter(
        (_, index) =>
          index !== subjectIndex
      ),
    }));
  };


  /* =====================================================
     ADD MATERIAL
  ===================================================== */

  const addMaterial = (
    subjectIndex
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [
        ...prev.subjects,
      ];

      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],

        materials: [
          ...updatedSubjects[subjectIndex]
            .materials,

          {
            name: "",
            description: "",
            content_type: "",
            content_url: "",
          },
        ],
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };


  /* =====================================================
     REMOVE MATERIAL
  ===================================================== */

  const removeMaterial = (
    subjectIndex,
    materialIndex
  ) => {
    setCourseData((prev) => {
      const updatedSubjects = [
        ...prev.subjects,
      ];

      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],

        materials:
          updatedSubjects[
            subjectIndex
          ].materials.filter(
            (_, index) =>
              index !== materialIndex
          ),
      };

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };


  /* =====================================================
     TAB
  ===================================================== */

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };


  /* =====================================================
     COUNTS
  ===================================================== */

  const totalMaterials =
    courseData.subjects.reduce(
      (total, subject) =>
        total + subject.materials.length,
      0
    );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading && courseId) {
    return (
      <div className="course-builder-loading">

        <div className="course-loading-spinner">
          <div></div>
        </div>

        <h3>Loading Course</h3>

        <p>
          Please wait while we load the course
          information...
        </p>

      </div>
    );
  }


  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="course-builder-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="course-builder-header">

        <div className="course-builder-header-left">

          <div className="course-builder-icon">
            <FontAwesomeIcon
              icon={faBookOpen}
            />
          </div>

          <div>

            <div className="course-builder-eyebrow">
              COURSE MANAGEMENT
            </div>

            <h1>
              {courseId
                ? "Edit Course"
                : "Create New Course"}
            </h1>

            <p>
              Build your course structure,
              subjects and learning materials.
            </p>

          </div>

        </div>


        <div className="course-builder-status">

          <span className="course-status-dot"></span>

          {courseId
            ? "Editing course"
            : "New course"}

        </div>

      </div>


      {/* =================================================
          STEP NAVIGATION
      ================================================= */}

      <div className="course-step-card">

        {/* COURSE */}

        <div className="course-step-item">

          <button
            type="button"
            className={`course-step-number ${
              activeTab === TABS.COURSE
                ? "active"
                : ""
            }`}
            onClick={() =>
              toggleTab(TABS.COURSE)
            }
          >
            {activeTab === TABS.COURSE ? (
              <FontAwesomeIcon
                icon={faBookOpen}
              />
            ) : (
              "1"
            )}
          </button>

          <button
            type="button"
            className={`course-step-content ${
              activeTab === TABS.COURSE
                ? "active"
                : ""
            }`}
            onClick={() =>
              toggleTab(TABS.COURSE)
            }
          >
            <strong>
              Course Details
            </strong>

            <span>
              Basic information
            </span>
          </button>

        </div>


        <div className="course-step-line"></div>


        {/* SUBJECTS */}

        <div className="course-step-item">

          <button
            type="button"
            className={`course-step-number ${
              activeTab === TABS.SUBJECTS
                ? "active"
                : ""
            }`}
            onClick={() =>
              toggleTab(TABS.SUBJECTS)
            }
          >
            {activeTab === TABS.SUBJECTS ? (
              <FontAwesomeIcon
                icon={faLayerGroup}
              />
            ) : (
              "2"
            )}
          </button>

          <button
            type="button"
            className={`course-step-content ${
              activeTab === TABS.SUBJECTS
                ? "active"
                : ""
            }`}
            onClick={() =>
              toggleTab(TABS.SUBJECTS)
            }
          >
            <strong>
              Subjects
            </strong>

            <span>
              {courseData.subjects.length}{" "}
              subject
              {courseData.subjects.length !==
              1
                ? "s"
                : ""}
            </span>
          </button>

        </div>


        <div className="course-step-line"></div>


        {/* MATERIALS */}

        <div className="course-step-item">

          <button
            type="button"
            className={`course-step-number ${
              activeTab === TABS.MATERIALS
                ? "active"
                : ""
            }`}
            onClick={() =>
              toggleTab(TABS.MATERIALS)
            }
          >
            {activeTab === TABS.MATERIALS ? (
              <FontAwesomeIcon
                icon={faFolderOpen}
              />
            ) : (
              "3"
            )}
          </button>

          <button
            type="button"
            className={`course-step-content ${
              activeTab === TABS.MATERIALS
                ? "active"
                : ""
            }`}
            onClick={() =>
              toggleTab(TABS.MATERIALS)
            }
          >
            <strong>
              Materials
            </strong>

            <span>
              {totalMaterials} materials
            </span>
          </button>

        </div>

      </div>


      {/* =================================================
          FORM

          IMPORTANT:
          noValidate fixes the hidden required
          input focus error.
      ================================================= */}

      <Form
        onSubmit={handleSubmit}
        noValidate
      >

        <TabContent activeTab={activeTab}>

          {/* =================================================
              COURSE TAB
          ================================================= */}

          <TabPane
            tabId={TABS.COURSE}
          >

            <div className="builder-section-card">

              <div className="builder-section-header">

                <div className="builder-section-title">

                  <div className="section-icon purple">
                    <FontAwesomeIcon
                      icon={faBookOpen}
                    />
                  </div>

                  <div>

                    <h2>
                      Course Information
                    </h2>

                    <p>
                      Enter the basic information
                      students will see.
                    </p>

                  </div>

                </div>

              </div>


              <div className="builder-section-body">

                {/* COURSE NAME + TYPE */}

                <Row>

                  <Col xs="12" lg="8">

                    <FormGroup className="modern-form-group">

                      <Label for="name">
                        Course Name
                        <span>*</span>
                      </Label>

                      <Input
                        type="text"
                        id="name"
                        className="modern-input"
                        value={
                          courseData.name
                        }
                        placeholder="e.g. Full Stack Web Development"
                        onChange={(e) =>
                          handleCourseChange(
                            "name",
                            e.target.value
                          )
                        }
                      />

                      <small>
                        Choose a clear and
                        recognizable course
                        name.
                      </small>

                    </FormGroup>

                  </Col>


                  <Col xs="12" lg="4">

                    <FormGroup className="modern-form-group">

                      <Label for="course_type">
                        Course Visibility
                        <span>*</span>
                      </Label>

                      <Input
                        type="select"
                        id="course_type"
                        className="modern-input"
                        value={
                          courseData.course_type
                        }
                        onChange={(e) =>
                          handleCourseChange(
                            "course_type",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select visibility
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


                {/* IMAGE + DURATION */}

                <Row>

                  <Col xs="12" lg="8">

                    <FormGroup className="modern-form-group">

                      <Label for="imageUrl">
                        Course Image
                      </Label>

                      <div className="image-url-wrapper">

                        <div className="input-leading-icon">
                          <FontAwesomeIcon
                            icon={faImage}
                          />
                        </div>

                        <Input
                          type="text"
                          id="imageUrl"
                          className="modern-input image-input"
                          value={
                            courseData.imageUrl
                          }
                          placeholder="https://example.com/course-image.jpg"
                          onChange={(e) =>
                            handleCourseChange(
                              "imageUrl",
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </FormGroup>

                  </Col>


                  <Col xs="12" lg="4">

                    <FormGroup className="modern-form-group">

                      <Label for="duration">
                        Duration
                        <span>*</span>
                      </Label>

                      <div className="duration-input-wrapper">

                        <Input
                          type="number"
                          id="duration"
                          name="duration"
                          className="modern-input"
                          value={
                            courseData.duration
                          }
                          placeholder="6"
                          min="1"
                          onChange={(e) => {
                            handleCourseChange(
                              "duration",
                              e.target.value ===
                                ""
                                ? ""
                                : parseFloat(
                                    e.target.value
                                  ) || 0
                            );
                          }}
                        />

                        <span>
                          Months
                        </span>

                      </div>

                    </FormGroup>

                  </Col>

                </Row>


                {/* IMAGE PREVIEW */}

                {courseData.imageUrl && (
                  <div className="course-image-preview">

                    <div className="preview-label">

                      <FontAwesomeIcon
                        icon={faImage}
                      />

                      Image Preview

                    </div>

                    <div className="preview-image-box">

                      <img
                        src={
                          courseData.imageUrl
                        }
                        alt="Course Preview"
                        onError={(e) => {
                          e.target.style.display =
                            "none";
                        }}
                      />

                    </div>

                  </div>
                )}


                {/* DESCRIPTION */}

                <FormGroup className="modern-form-group">

                  <Label>
                    Course Description
                    <span>*</span>
                  </Label>

                  <div className="quill-modern-wrapper">

                    <ReactQuill
                      value={
                        courseData.description
                      }
                      onChange={(value) =>
                        handleCourseChange(
                          "description",
                          value
                        )
                      }
                      modules={{
                        toolbar: [
                          [
                            {
                              header: [
                                1,
                                2,
                                3,
                                false,
                              ],
                            },
                          ],

                          [
                            "bold",
                            "italic",
                            "underline",
                            "strike",
                          ],

                          [
                            {
                              list: "ordered",
                            },
                            {
                              list: "bullet",
                            },
                          ],

                          [
                            "link",
                            "image",
                          ],

                          ["clean"],
                        ],
                      }}
                    />

                  </div>

                </FormGroup>

              </div>

            </div>


            {/* NAVIGATION */}

            <div className="builder-navigation">

              <div></div>

              <button
                type="button"
                className="builder-next-btn"
                onClick={() => {
                  if (validateCourse()) {
                    toggleTab(
                      TABS.SUBJECTS
                    );
                  }
                }}
              >
                Continue to Subjects

                <FontAwesomeIcon
                  icon={faArrowRight}
                />

              </button>

            </div>

          </TabPane>


          {/* =================================================
              SUBJECTS TAB
          ================================================= */}

          <TabPane
            tabId={TABS.SUBJECTS}
          >

            <div className="builder-section-card">

              <div className="builder-section-header">

                <div className="builder-section-title">

                  <div className="section-icon blue">
                    <FontAwesomeIcon
                      icon={faLayerGroup}
                    />
                  </div>

                  <div>

                    <h2>
                      Course Subjects
                    </h2>

                    <p>
                      Organize your course into
                      structured subjects.
                    </p>

                  </div>

                </div>


                <div className="item-count-badge">

                  {courseData.subjects.length}

                  {" "}

                  Subject
                  {courseData.subjects.length !==
                  1
                    ? "s"
                    : ""}

                </div>

              </div>


              <div className="builder-section-body subjects-body">

                {courseData.subjects.map(
                  (
                    subject,
                    subjectIndex
                  ) => (

                    <div
                      key={
                        subject._id ||
                        subjectIndex
                      }
                      className="subject-builder-card"
                    >

                      {/* SUBJECT HEADER */}

                      <div className="subject-card-header">

                        <div className="subject-heading">

                          <div className="subject-number">
                            {subjectIndex +
                              1}
                          </div>

                          <div>

                            <h3>
                              {subject.name ||
                                `Subject ${
                                  subjectIndex +
                                  1
                                }`}
                            </h3>

                            <span>
                              Subject
                              configuration
                            </span>

                          </div>

                        </div>


                        {courseData.subjects
                          .length > 1 && (

                          <button
                            type="button"
                            className="delete-outline-btn"
                            onClick={() =>
                              removeSubject(
                                subjectIndex
                              )
                            }
                          >

                            <FontAwesomeIcon
                              icon={
                                faTrash
                              }
                            />

                            <span>
                              Remove
                            </span>

                          </button>

                        )}

                      </div>


                      {/* SUBJECT BODY */}

                      <div className="subject-card-body">

                        <Row>

                          <Col
                            xs="12"
                            lg="8"
                          >

                            <FormGroup className="modern-form-group">

                              <Label
                                for={`subject-name-${subjectIndex}`}
                              >
                                Subject Name
                                <span>
                                  *
                                </span>
                              </Label>

                              <Input
                                type="text"
                                id={`subject-name-${subjectIndex}`}
                                className="modern-input"
                                value={
                                  subject.name
                                }
                                placeholder="Enter subject name"
                                onChange={(e) =>
                                  handleSubjectChange(
                                    subjectIndex,
                                    "name",
                                    e.target
                                      .value
                                  )
                                }
                              />

                            </FormGroup>

                          </Col>


                          <Col
                            xs="12"
                            lg="4"
                          >

                            <FormGroup className="modern-form-group">

                              <Label
                                for={`subject-duration-${subjectIndex}`}
                              >
                                Duration
                                <span>
                                  *
                                </span>
                              </Label>

                              <div className="duration-input-wrapper">

                                <Input
                                  type="number"
                                  id={`subject-duration-${subjectIndex}`}
                                  className="modern-input"
                                  value={
                                    subject.duration
                                  }
                                  placeholder="1"
                                  min="1"
                                  onChange={(e) =>
                                    handleSubjectChange(
                                      subjectIndex,
                                      "duration",
                                      e.target
                                        .value ===
                                        ""
                                        ? ""
                                        : parseFloat(
                                            e.target
                                              .value
                                          ) || 0
                                    )
                                  }
                                />

                                <span>
                                  Months
                                </span>

                              </div>

                            </FormGroup>

                          </Col>

                        </Row>


                        <FormGroup className="modern-form-group">

                          <Label
                            for={`subject-description-${subjectIndex}`}
                          >
                            Subject Description
                          </Label>

                          <div className="quill-modern-wrapper small-editor">

                            <ReactQuill
                              value={
                                subject.description
                              }
                              onChange={(
                                value
                              ) =>
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

                  )
                )}


                {/* ADD SUBJECT */}

                <button
                  type="button"
                  className="add-item-btn"
                  onClick={addSubject}
                >

                  <FontAwesomeIcon
                    icon={faPlus}
                  />

                  Add Another Subject

                </button>

              </div>

            </div>


            {/* NAVIGATION */}

            <div className="builder-navigation">

              <button
                type="button"
                className="builder-back-btn"
                onClick={() =>
                  toggleTab(
                    TABS.COURSE
                  )
                }
              >

                <FontAwesomeIcon
                  icon={faArrowLeft}
                />

                Back to Course

              </button>


              <button
                type="button"
                className="builder-next-btn"
                onClick={() => {
                  if (
                    validateSubjects()
                  ) {
                    toggleTab(
                      TABS.MATERIALS
                    );
                  }
                }}
              >

                Continue to Materials

                <FontAwesomeIcon
                  icon={faArrowRight}
                />

              </button>

            </div>

          </TabPane>


          {/* =================================================
              MATERIALS TAB
          ================================================= */}

          <TabPane
            tabId={TABS.MATERIALS}
          >

            <div className="builder-section-card">

              <div className="builder-section-header">

                <div className="builder-section-title">

                  <div className="section-icon orange">

                    <FontAwesomeIcon
                      icon={faFolderOpen}
                    />

                  </div>

                  <div>

                    <h2>
                      Learning Materials
                    </h2>

                    <p>
                      Add videos, documents,
                      PDFs, links and images.
                    </p>

                  </div>

                </div>

              </div>


              <div className="builder-section-body materials-body">

                {courseData.subjects.map(
                  (
                    subject,
                    subjectIndex
                  ) => (

                    <div
                      key={
                        subject._id ||
                        subjectIndex
                      }
                      className="materials-subject-card"
                    >

                      {/* SUBJECT HEADER */}

                      <div className="materials-subject-header">

                        <div className="materials-subject-number">

                          {subjectIndex +
                            1}

                        </div>

                        <div>

                          <span>
                            SUBJECT
                          </span>

                          <h3>
                            {subject.name ||
                              `Subject ${
                                subjectIndex +
                                1
                              }`}
                          </h3>

                        </div>

                      </div>


                      {/* MATERIALS */}

                      <div className="materials-list">

                        {subject.materials.map(
                          (
                            material,
                            materialIndex
                          ) => (

                            <div
                              key={
                                material._id ||
                                materialIndex
                              }
                              className="material-builder-card"
                            >

                              <div className="material-number">

                                {materialIndex +
                                  1}

                              </div>


                              <div className="material-content">

                                {/* MATERIAL HEADER */}

                                <div className="material-header">

                                  <div>

                                    <h4>
                                      Material{" "}
                                      {materialIndex +
                                        1}
                                    </h4>

                                    <span>
                                      Learning
                                      resource
                                    </span>

                                  </div>


                                  {subject
                                    .materials
                                    .length >
                                    1 && (

                                    <button
                                      type="button"
                                      className="material-delete-btn"
                                      onClick={() =>
                                        removeMaterial(
                                          subjectIndex,
                                          materialIndex
                                        )
                                      }
                                    >

                                      <FontAwesomeIcon
                                        icon={
                                          faTrash
                                        }
                                      />

                                    </button>

                                  )}

                                </div>


                                {/* NAME + TYPE */}

                                <Row>

                                  <Col
                                    xs="12"
                                    lg="6"
                                  >

                                    <FormGroup className="modern-form-group">

                                      <Label
                                        for={`material-name-${subjectIndex}-${materialIndex}`}
                                      >
                                        Material
                                        Name
                                        <span>
                                          *
                                        </span>
                                      </Label>

                                      <Input
                                        type="text"
                                        id={`material-name-${subjectIndex}-${materialIndex}`}
                                        className="modern-input"
                                        value={
                                          material.name
                                        }
                                        placeholder="e.g. Introduction Video"
                                        onChange={(
                                          e
                                        ) =>
                                          handleMaterialChange(
                                            subjectIndex,
                                            materialIndex,
                                            "name",
                                            e.target
                                              .value
                                          )
                                        }
                                      />

                                    </FormGroup>

                                  </Col>


                                  <Col
                                    xs="12"
                                    lg="6"
                                  >

                                    <FormGroup className="modern-form-group">

                                      <Label
                                        for={`material-content_type-${subjectIndex}-${materialIndex}`}
                                      >
                                        Content
                                        Type
                                        <span>
                                          *
                                        </span>
                                      </Label>

                                      <Input
                                        type="select"
                                        id={`material-content_type-${subjectIndex}-${materialIndex}`}
                                        className="modern-input"
                                        value={
                                          material.content_type
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          handleMaterialChange(
                                            subjectIndex,
                                            materialIndex,
                                            "content_type",
                                            e.target
                                              .value
                                          )
                                        }
                                      >

                                        <option value="">
                                          Select
                                          content
                                          type
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

                                  </Col>

                                </Row>


                                {/* DESCRIPTION */}

                                <FormGroup className="modern-form-group">

                                  <Label
                                    for={`material-description-${subjectIndex}-${materialIndex}`}
                                  >
                                    Description
                                  </Label>

                                  <Input
                                    type="textarea"
                                    id={`material-description-${subjectIndex}-${materialIndex}`}
                                    className="modern-textarea"
                                    value={
                                      material.description
                                    }
                                    placeholder="Describe what students will learn from this material..."
                                    rows="3"
                                    onChange={(
                                      e
                                    ) =>
                                      handleMaterialChange(
                                        subjectIndex,
                                        materialIndex,
                                        "description",
                                        e.target
                                          .value
                                      )
                                    }
                                  />

                                </FormGroup>


                                {/* URL */}

                                <FormGroup className="modern-form-group">

                                  <Label
                                    for={`material-content_url-${subjectIndex}-${materialIndex}`}
                                  >
                                    Content URL
                                    <span>
                                      *
                                    </span>
                                  </Label>

                                  <div className="url-input-wrapper">

                                    <div className="url-icon">

                                      <FontAwesomeIcon
                                        icon={
                                          faLink
                                        }
                                      />

                                    </div>

                                    <Input
                                      type="url"
                                      id={`material-content_url-${subjectIndex}-${materialIndex}`}
                                      className="modern-input"
                                      value={
                                        material.content_url
                                      }
                                      placeholder="https://..."
                                      onChange={(
                                        e
                                      ) =>
                                        handleMaterialChange(
                                          subjectIndex,
                                          materialIndex,
                                          "content_url",
                                          e.target
                                            .value
                                        )
                                      }
                                    />

                                  </div>

                                </FormGroup>

                              </div>

                            </div>

                          )
                        )}

                      </div>


                      {/* ADD MATERIAL */}

                      <div className="materials-add-wrapper">

                        <button
                          type="button"
                          className="add-material-btn"
                          onClick={() =>
                            addMaterial(
                              subjectIndex
                            )
                          }
                        >

                          <FontAwesomeIcon
                            icon={faPlus}
                          />

                          Add Material

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* FINAL NAVIGATION */}

            <div className="builder-navigation">

              <button
                type="button"
                className="builder-back-btn"
                onClick={() =>
                  toggleTab(
                    TABS.SUBJECTS
                  )
                }
              >

                <FontAwesomeIcon
                  icon={faArrowLeft}
                />

                Back to Subjects

              </button>


              <button
                type="submit"
                className="builder-save-btn"
                disabled={saving}
              >

                <FontAwesomeIcon
                  icon={
                    saving
                      ? faSave
                      : faCheck
                  }
                />

                {saving
                  ? courseId
                    ? "Updating Course..."
                    : "Creating Course..."
                  : courseId
                  ? "Update Course"
                  : "Create Course"}

              </button>

            </div>

          </TabPane>

        </TabContent>

      </Form>

    </div>
  );
};

export default CourseForm;