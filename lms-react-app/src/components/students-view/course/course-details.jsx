import React, { useEffect, useState } from "react";
import { useStudentContext } from "../../../contexts/Student-context";
import { useParams, useNavigate } from "react-router-dom";
import { CourseService } from "../../../service/baseService";
import {
  Button,
  Card,
  CardBody,
  Col,
  Row,
  Spinner,
} from "reactstrap";
import ReactPlayer from "react-player";
import DOMPurify from "dompurify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCirclePlay,
  faClock,
  faFilePdf,
  faGraduationCap,
  faLayerGroup,
  faPlay,
  faUsers,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";


const CourseDetails = () => {
  const {
    studentCourse,
    setStudentCourse,
    studentCourseId,
    setStudentCourseId,
  } = useStudentContext();

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Fetch Course
  |--------------------------------------------------------------------------
  */

  const fetchCourseDetails = async (courseId) => {
    try {
      setLoading(true);

      const res = await CourseService(courseId);

      setStudentCourse(res.data);
    } catch (error) {
      console.error(
        "Course details error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Duration
  |--------------------------------------------------------------------------
  */

  const convertTime = (time) => {
    const hours = parseFloat(time);

    if (Number.isNaN(hours) || hours <= 0) {
      return "Self paced";
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;

      if (remainingDays === 0) {
        return `${weeks} ${
          weeks === 1 ? "week" : "weeks"
        }`;
      }

      return `${weeks} ${
        weeks === 1 ? "week" : "weeks"
      } and ${remainingDays} ${
        remainingDays === 1 ? "day" : "days"
      }`;
    }

    if (days === 0) {
      return `${remainingHours} ${
        remainingHours === 1 ? "hour" : "hours"
      }`;
    }

    if (remainingHours === 0) {
      return `${days} ${
        days === 1 ? "day" : "days"
      }`;
    }

    return `${days} ${
      days === 1 ? "day" : "days"
    } and ${remainingHours} ${
      remainingHours === 1 ? "hour" : "hours"
    }`;
  };

  /*
  |--------------------------------------------------------------------------
  | Subject Toggle
  |--------------------------------------------------------------------------
  */

  const toggleSubject = (subjectId) => {
    setOpenSubjects((previous) => ({
      ...previous,
      [subjectId]: !previous[subjectId],
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Get Materials
  |--------------------------------------------------------------------------
  */

  const getTotalMaterials = () => {
    if (!Array.isArray(studentCourse?.subjects)) {
      return 0;
    }

    return studentCourse.subjects.reduce(
      (total, subject) =>
        total +
        (Array.isArray(subject?.materials)
          ? subject.materials.length
          : 0),
      0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const openMaterial = (material) => {
    if (!material) return;

    /*
     * Keep your existing material route if your
     * MaterialPage uses material ID.
     */
    if (material?._id) {
      navigate(
        `/course/materials/${material._id}`
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Effects
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (id) {
      setStudentCourseId(id);
    }
  }, [id, setStudentCourseId]);

  useEffect(() => {
    if (studentCourseId) {
      fetchCourseDetails(studentCourseId);
    }
  }, [studentCourseId]);

  useEffect(() => {
    return () => {
      setStudentCourse(null);
    };
  }, [setStudentCourse]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="course-details-loading">
        <div className="course-details-loading-icon">
          <Spinner />
        </div>

        <h4>Loading course...</h4>

        <p>
          Preparing your learning environment.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Course
  |--------------------------------------------------------------------------
  */

  if (!studentCourse) {
    return (
      <div className="course-details-empty">
        <div className="course-details-empty-icon">
          <FontAwesomeIcon icon={faBookOpen} />
        </div>

        <h3>Course not found</h3>

        <p>
          We couldn't load the requested course.
        </p>

        <Button
          className="course-back-btn"
          onClick={() => navigate("/courses")}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Courses
        </Button>
      </div>
    );
  }

  const subjects = Array.isArray(
    studentCourse.subjects
  )
    ? studentCourse.subjects
    : [];

  return (
    <div className="course-details-page">
      <div className="course-details-container">

        {/* ============================================================
            TOP NAVIGATION
        ============================================================= */}

        <div className="course-details-topbar">
          <button
            type="button"
            className="course-back-link"
            onClick={() => navigate("/courses")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Courses</span>
          </button>

          <div className="course-learning-label">
            <FontAwesomeIcon
              icon={faGraduationCap}
            />
            <span>Learning Center</span>
          </div>
        </div>

        {/* ============================================================
            HERO
        ============================================================= */}


        {/* ============================================================
            LEARNING CONTENT HEADER
        ============================================================= */}

        <div className="course-learning-header">

          <div>
            <span className="course-section-label">
              YOUR LEARNING PATH
            </span>

            <h2>Subjects & Materials</h2>

            <p>
              Select a subject and start exploring
              your learning materials.
            </p>
          </div>

          <div className="course-learning-count">
            <FontAwesomeIcon
              icon={faBookOpen}
            />

            <span>
              {subjects.length}{" "}
              {subjects.length === 1
                ? "Subject"
                : "Subjects"}
            </span>
          </div>
        </div>

        {/* ============================================================
            SUBJECTS
        ============================================================= */}

        <div className="course-subject-list">

          {subjects.length === 0 ? (
            <div className="course-no-subjects">
              <div>
                <FontAwesomeIcon
                  icon={faBookOpen}
                />
              </div>

              <h3>No subjects available</h3>

              <p>
                Course content will appear here
                once subjects are added.
              </p>
            </div>
          ) : (
            subjects.map((subject, index) => {

              const materials = Array.isArray(
                subject?.materials
              )
                ? subject.materials
                : [];

              const isOpen =
                openSubjects[subject?._id];

              return (
                <Card
                  key={subject?._id || index}
                  className={`course-subject-card ${
                    isOpen ? "open" : ""
                  }`}
                >

                  {/* SUBJECT HEADER */}

                  <button
                    type="button"
                    className="course-subject-header"
                    onClick={() =>
                      toggleSubject(
                        subject?._id
                      )
                    }
                  >

                    <div className="course-subject-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="course-subject-main">

                      <div className="course-subject-title-row">
                        <h3>
                          {subject?.name ||
                            "Untitled Subject"}
                        </h3>

                        <span className="course-material-count">
                          {materials.length}{" "}
                          {materials.length === 1
                            ? "material"
                            : "materials"}
                        </span>
                      </div>

                      {subject?.description && (
                        <p>
                          {subject.description}
                        </p>
                      )}

                    </div>

                    <div className="course-subject-toggle">
                      <FontAwesomeIcon
                        icon={
                          isOpen
                            ? faChevronUp
                            : faChevronDown
                        }
                      />
                    </div>

                  </button>

                  {/* MATERIALS */}

                  {isOpen && (
                    <CardBody className="course-materials-body">

                      {materials.length === 0 ? (
                        <div className="course-no-materials">
                          <FontAwesomeIcon
                            icon={faBookOpen}
                          />

                          <span>
                            No materials available
                            for this subject.
                          </span>
                        </div>
                      ) : (
                        <div className="course-material-list">

                          {materials.map(
                            (
                              material,
                              materialIndex
                            ) => {

                              const isVideo =
                                material?.content_type ===
                                "Video";

                              const isPdf =
                                material?.content_type ===
                                "PDF";

                              return (
                                <div
                                  key={
                                    material?._id ||
                                    materialIndex
                                  }
                                  className="course-material-card"
                                >

                                  <div className="course-material-icon">
                                    <FontAwesomeIcon
                                      icon={
                                        isVideo
                                          ? faCirclePlay
                                          : isPdf
                                          ? faFilePdf
                                          : faBookOpen
                                      }
                                    />
                                  </div>

                                  <div className="course-material-info">

                                    <div className="course-material-top">

                                      <h4>
                                        {material?.name ||
                                          "Untitled Material"}
                                      </h4>

                                      <span
                                        className={`course-content-type ${
                                          isVideo
                                            ? "video"
                                            : isPdf
                                            ? "pdf"
                                            : "other"
                                        }`}
                                      >
                                        {material?.content_type ||
                                          "Material"}
                                      </span>

                                    </div>

                                    {material?.description && (
                                      <p>
                                        {
                                          material.description
                                        }
                                      </p>
                                    )}

                                  </div>

                                  <div className="course-material-action">

                                    {isPdf ? (
                                      <Button
                                        type="button"
                                        className="material-open-btn"
                                        onClick={() =>
                                          openMaterial(
                                            material
                                          )
                                        }
                                      >
                                        <span>
                                          Open
                                        </span>

                                        <FontAwesomeIcon
                                          icon={
                                            faArrowRight
                                          }
                                        />
                                      </Button>
                                    ) : isVideo ? (
                                      <Button
                                        type="button"
                                        className="material-play-btn"
                                        onClick={() =>
                                          openMaterial(
                                            material
                                          )
                                        }
                                      >
                                        <FontAwesomeIcon
                                          icon={faPlay}
                                        />

                                        <span>
                                          Watch
                                        </span>
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        className="material-open-btn"
                                        onClick={() =>
                                          openMaterial(
                                            material
                                          )
                                        }
                                      >
                                        <span>
                                          Open
                                        </span>

                                        <FontAwesomeIcon
                                          icon={
                                            faArrowRight
                                          }
                                        />
                                      </Button>
                                    )}

                                  </div>
                                </div>
                              );
                            }
                          )}

                        </div>
                      )}

                    </CardBody>
                  )}

                </Card>
              );
            })
          )}

        </div>

      </div>
    </div>
  );
};

export default CourseDetails;