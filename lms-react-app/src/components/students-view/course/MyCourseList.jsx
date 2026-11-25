
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaClock,
  FaSearch,
  FaPlay,
  FaArrowRight,
  FaExclamationCircle,
  FaGraduationCap,
  FaSyncAlt,
  FaTimes,
  FaFilter,
  FaLock,
  FaGlobe,
  FaCalendarAlt,
  FaCheckCircle,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

import { toast } from "react-toastify";
import DOMPurify from "dompurify";

import { CurrentUserEnrollments, getDurationUnits } from "../../../service/baseService";
import { useAuthcontext } from "contexts/Authcontext";

const MyCourseList = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthcontext();

  const userId = authUser?.user?._id;

  const [courses, setCourses] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedCourse, setSelectedCourse] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH ENROLLED COURSES
  // ==========================================

  const fetchCourseList = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setCourses([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await CurrentUserEnrollments(userId);

        const enrolledCourses =
          response?.enrolledCourses || [];

        const validCourses = enrolledCourses.filter(
          (enrollment) =>
            enrollment?.course &&
            typeof enrollment.course === "object" &&
            enrollment.course?._id
        );

        setCourses(validCourses);
      } catch (err) {
        const errorMessage =
          err?.response?.data?.message ||
          "Unable to load your enrolled courses.";

        setError(errorMessage);

        if (!isRefresh) {
          setCourses([]);
        }

        toast.error(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchCourseList();
  }, [fetchCourseList]);

  // ==========================================
  // COURSE HELPERS
  // ==========================================

  const getCourse = (enrollment) =>
    enrollment?.course || {};

  const getCourseId = (enrollment) =>
    getCourse(enrollment)?._id || "";

  const getCourseTitle = (enrollment) =>
    getCourse(enrollment)?.name ||
    getCourse(enrollment)?.title ||
    "Untitled Course";

  const getCourseDescription = (enrollment) =>
    getCourse(enrollment)?.description ||
    "Explore the lessons and learning materials available in this course.";

  const getCourseImage = (enrollment) =>
    getCourse(enrollment)?.imageUrl ||
    getCourse(enrollment)?.thumbnail ||
    getCourse(enrollment)?.image ||
    getCourse(enrollment)?.courseImage ||
    "";

  const getCourseType = (enrollment) =>
    getCourse(enrollment)?.course_type ||
    "unknown";

  const getInstructor = (enrollment) => {
    const instructor = getCourse(enrollment)?.created_by;
    console.log(instructor)
    if (typeof instructor === "object" && instructor) {
      return (
        instructor?.fullname ||
        instructor?.name ||
        instructor?.username ||
        "Course Instructor"
      );
    }

    return "Course Instructor";
  };

  const getDuration = (enrollment) => {
    const course = getCourse(enrollment);

    if (
      course?.duration === undefined ||
      course?.duration === null ||
      course?.duration === ""
    ) {
      return "";
    }

    return `${course.duration} ${getDurationUnits(course?.duration, course?.duration_unit)}`;
  };

  // ==========================================
  // ENROLLMENT HELPERS
  // ==========================================

  const getEnrollmentStatus = (enrollment) =>
    enrollment?.status || "unknown";

  const getEnrollmentType = (enrollment) =>
    enrollment?.enrollmentType || "unknown";

  const getEnrollmentDate = (enrollment) =>
    enrollment?.enrolledAt ||
    enrollment?.createdAt ||
    null;

  const isPaidCourse = (enrollment) =>
    getCourse(enrollment)?.is_paidCourse === true;

  const getCoursePrice = (enrollment) => {
    const course = getCourse(enrollment);

    if (!course?.is_paidCourse) {
      return "Free";
    }

    return `${course?.currency || "INR"} ${course?.price ?? 0}`;
  };

  // ==========================================
  // DESCRIPTION FOR SEARCH
  // ==========================================

  const getPlainDescription = (enrollment) => {
    const description = getCourseDescription(enrollment);

    const cleanHTML = DOMPurify.sanitize(description);

    const tempElement = document.createElement("div");
    tempElement.innerHTML = cleanHTML;

    return tempElement.textContent || tempElement.innerText || "";
  };

  // ==========================================
  // COURSE COUNTS
  // ==========================================

  const activeCourses = useMemo(
    () =>
      courses.filter(
        (enrollment) =>
          getEnrollmentStatus(enrollment) === "active"
      ),
    [courses]
  );

  const completedCourses = useMemo(
    () =>
      courses.filter(
        (enrollment) =>
          getEnrollmentStatus(enrollment) === "completed"
      ),
    [courses]
  );

  const privateCourses = useMemo(
    () =>
      courses.filter(
        (enrollment) =>
          getCourseType(enrollment) === "private"
      ),
    [courses]
  );

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let result = courses.filter((enrollment) => {
      const title = getCourseTitle(enrollment).toLowerCase();

      const description =
        getPlainDescription(enrollment).toLowerCase();

      const type = getCourseType(enrollment).toLowerCase();

      const instructor =
        getInstructor(enrollment).toLowerCase();

      const enrollmentType =
        getEnrollmentType(enrollment).toLowerCase();

      const status =
        getEnrollmentStatus(enrollment).toLowerCase();

      const matchesSearch =
        !term ||
        title.includes(term) ||
        description.includes(term) ||
        type.includes(term) ||
        instructor.includes(term) ||
        enrollmentType.includes(term) ||
        status.includes(term);

      const matchesType =
        selectedType === "all" ||
        type === selectedType;

      const matchesStatus =
        selectedStatus === "all" ||
        status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });

    return result;
  }, [
    courses,
    searchTerm,
    selectedType,
    selectedStatus,
  ]);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const continueLearning = (enrollment) => {
    const courseId = getCourseId(enrollment);

    if (!courseId) {
      toast.error("Invalid course information.");
      return;
    }

    if (getEnrollmentStatus(enrollment) !== "active") {
      toast.info("This enrollment is not currently active.");
      return;
    }

    setSelectedCourse(null);

    navigate(`/course/details/${courseId}`);
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // RESET FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedStatus("all");
  };

  const hasFilters =
    searchTerm.trim() !== "" ||
    selectedType !== "all" ||
    selectedStatus !== "all";

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="my-course-page">
        <div className="course-loading-container">
          <div className="course-spinner" />

          <h3>Preparing your learning space</h3>

          <p>Loading your enrolled courses...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && courses.length === 0) {
    return (
      <div className="my-course-page">
        <div className="course-error-container">
          <div className="course-error-icon">
            <FaExclamationCircle />
          </div>

          <h2>Unable to load courses</h2>

          <p>{error}</p>

          <button
            type="button"
            className="course-primary-btn"
            onClick={() => fetchCourseList()}
          >
            <FaSyncAlt />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <main className="my-course-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <section className="course-dashboard-header">

        <div className="course-header-content">

          <span className="course-header-label">
            <FaGraduationCap />
            STUDENT LEARNING PORTAL
          </span>

          <h1>
            My Learning
            <span className="course-header-highlight">
              {" "}Journey
            </span>
          </h1>

          <p>
            Your courses, your progress, your future.
            Pick up where you left off and keep learning.
          </p>

          <div className="course-header-bottom">

            <div className="course-header-summary">
              <FaBookOpen />

              <span>
                You are enrolled in{" "}
                <strong>{courses.length}</strong>{" "}
                {courses.length === 1 ? "course" : "courses"}
              </span>
            </div>

          </div>

        </div>

        <div className="course-header-art">

          <div className="course-art-circle">
            <FaGraduationCap />
          </div>

          <div className="course-art-book">
            <FaBookOpen />
          </div>

          <div className="course-art-clock">
            <FaClock />
          </div>

        </div>

      </section>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <section className="course-summary-grid">

        <article className="course-summary-card">

          <div className="course-summary-icon icon-purple">
            <FaBookOpen />
          </div>

          <div>
            <span>Total Courses</span>
            <strong>{courses.length}</strong>
          </div>

        </article>

        <article className="course-summary-card">

          <div className="course-summary-icon icon-green">
            <FaCheckCircle />
          </div>

          <div>
            <span>Active Courses</span>
            <strong>{activeCourses.length}</strong>
          </div>

        </article>

        <article className="course-summary-card">

          <div className="course-summary-icon icon-blue">
            <FaGlobe />
          </div>

          <div>
            <span>Public Courses</span>
            <strong>
              {
                courses.filter(
                  (item) =>
                    getCourseType(item) === "public"
                ).length
              }
            </strong>
          </div>

        </article>

        <article className="course-summary-card">

          <div className="course-summary-icon icon-orange">
            <FaLock />
          </div>

          <div>
            <span>Private Courses</span>
            <strong>{privateCourses.length}</strong>
          </div>

        </article>

      </section>

      {/* ======================================
          COURSE SECTION HEADER
      ====================================== */}

      <section className="course-library-section">

        <div className="course-library-heading">

          <div>
            <span className="course-section-label">
              YOUR LEARNING LIBRARY
            </span>

            <h2>Enrolled Courses</h2>

            <p>
              Explore your courses and continue learning.
            </p>
          </div>

          <button
            type="button"
            className="course-refresh-button"
            onClick={() => fetchCourseList(true)}
            disabled={refreshing}
          >
            <FaSyncAlt
              className={refreshing ? "refresh-animation" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>

        {/* ======================================
            SEARCH & FILTER
        ====================================== */}

        <div className="course-toolbar">

          <div className="course-search-box">

            <FaSearch />

            <input
              type="search"
              placeholder="Search by course name, instructor..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="search-clear-button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}

          </div>

          <div className="course-filter-box">

            <FaFilter />

            <select
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value)
              }
              aria-label="Filter by course type"
            >
              <option value="all">All Course Types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

          </div>

          <select
            className="course-status-filter"
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value)
            }
            aria-label="Filter by enrollment status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>

        </div>

        {/* ======================================
            RESULTS
        ====================================== */}

        <div className="course-results-row">

          <p>
            Showing{" "}
            <strong>{filteredCourses.length}</strong>{" "}
            of{" "}
            <strong>{courses.length}</strong>{" "}
            courses
          </p>

          {hasFilters && (
            <button
              type="button"
              className="course-clear-filters"
              onClick={clearFilters}
            >
              <FaTimes />
              Clear Filters
            </button>
          )}

        </div>

        {/* ======================================
            EMPTY STATE
        ====================================== */}

        {filteredCourses.length === 0 ? (

          <div className="course-empty-state">

            <div className="course-empty-icon">
              <FaBookOpen />
            </div>

            <h3>
              {courses.length === 0
                ? "Your learning journey starts here"
                : "No courses found"}
            </h3>

            <p>
              {courses.length === 0
                ? "Once you enroll in a course, it will appear here for easy access."
                : "We couldn't find courses matching your search or filters."}
            </p>

            {hasFilters && (
              <button
                type="button"
                className="course-secondary-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          /* ======================================
              COURSE GRID
          ====================================== */

          <div className="my-course-grid">

            {filteredCourses.map((enrollment) => {

              const course = getCourse(enrollment);

              const courseId = getCourseId(enrollment);

              const image = getCourseImage(enrollment);

              const courseType = getCourseType(enrollment);

              const status = getEnrollmentStatus(enrollment);

              const enrollmentDate =
                getEnrollmentDate(enrollment);

              return (

                <article
                  className="my-course-card"
                  key={enrollment._id || courseId}
                >

                  {/* COURSE IMAGE */}

                  <div className="course-card-image-wrapper">

                    {image ? (

                      <img
                        src={image}
                        alt={getCourseTitle(enrollment)}
                        className="course-card-image"
                        loading="lazy"
                      />

                    ) : (

                      <div className="course-card-image-placeholder">
                        <FaBookOpen />
                      </div>

                    )}

                    <div className="course-image-shade" />

                    <span
                      className={`course-visibility ${
                        courseType === "private"
                          ? "visibility-private"
                          : "visibility-public"
                      }`}
                    >
                      {courseType === "private" ? (
                        <FaLock />
                      ) : (
                        <FaGlobe />
                      )}

                      {courseType}
                    </span>

                  </div>

                  {/* COURSE BODY */}

                  <div className="course-card-content">

                    {/* COURSE CATEGORY */}

                    {/* COURSE TITLE */}

                    <h3 className="course-card-title">
                      {getCourseTitle(enrollment)}
                    </h3>

                    {/* COURSE DESCRIPTION */}

                    {/* <div
                      className="course-card-description"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          getCourseDescription(enrollment)
                        ),
                      }}
                    /> */}

                    {/* COURSE DETAILS */}

                    <div className="course-card-information">

                      <div className="course-information-item">

                        <FaChalkboardTeacher />

                        <span className="text-capitalize">
                          {getInstructor(enrollment)}
                        </span>

                      </div>

                      {getDuration(enrollment) && (
                        <div className="course-information-item">

                          <FaClock />

                          <span>
                            {getDuration(enrollment)}
                          </span>

                        </div>
                      )}

                      <div className="course-information-item">

                        <FaCalendarAlt />

                        <span>
                          Joined {formatDate(enrollmentDate)}
                        </span>

                      </div>
                      

                    </div>

                    {/* ENROLLMENT FOOTER */}

                    <div className="course-card-footer">

                      <div className="course-price-information">

                        <span>Course Fee</span>

                        <strong>
                          {getCoursePrice(enrollment)}
                        </strong>

                      </div>

                      <span className="course-enrollment-type">
                        {getEnrollmentType(enrollment)}
                      </span>

                    </div>

                    {/* ACTION BUTTONS */}

                    <div className="course-card-actions">

                      <button
                        type="button"
                        className="course-continue-button"
                        onClick={() =>
                          continueLearning(enrollment)
                        }
                        disabled={status !== "active"}
                      >

                        <FaPlay />

                        <span>
                          Continue Learning
                        </span>

                        <FaArrowRight />

                      </button>

                      <button
                        type="button"
                        className="course-view-details-button"
                        onClick={() =>
                          setSelectedCourse(enrollment)
                        }
                      >
                        View Course Details
                      </button>

                    </div>

                  </div>

                </article>

              );
            })}

          </div>

        )}

      </section>

      {/* ======================================
          COURSE DETAILS MODAL
      ====================================== */}

      {selectedCourse && (

        <div
          className="course-modal-overlay"
          onClick={() => setSelectedCourse(null)}
        >

          <section
            className="course-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-details-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              className="course-modal-close"
              onClick={() => setSelectedCourse(null)}
              aria-label="Close details"
            >
              <FaTimes />
            </button>

            {/* IMAGE */}

            <div className="course-modal-image-container">

              {getCourseImage(selectedCourse) ? (

                <img
                  src={getCourseImage(selectedCourse)}
                  alt={getCourseTitle(selectedCourse)}
                />

              ) : (

                <div className="course-modal-image-placeholder">
                  <FaBookOpen />
                </div>

              )}

              <div className="course-modal-image-overlay">

                <span>
                  {getCourseType(selectedCourse)}
                </span>

              </div>

            </div>

            {/* MODAL BODY */}

            <div className="course-modal-content">

              <div className="course-modal-badges">

                <span className="course-category-chip">
                  {getCourseType(selectedCourse)}
                </span>

                <span
                  className={`course-status-chip ${
                    getEnrollmentStatus(selectedCourse) === "active"
                      ? "status-active"
                      : "status-inactive"
                  }`}
                >
                  {getEnrollmentStatus(selectedCourse)}
                </span>

              </div>

              <h2 id="course-details-title">
                {getCourseTitle(selectedCourse)}
              </h2>

              <div
                className="course-modal-description"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    getCourseDescription(selectedCourse)
                  ),
                }}
              />

              {/* DETAILS GRID */}

              <div className="course-modal-details-grid">

                <div className="course-modal-detail">

                  <FaChalkboardTeacher />

                  <div>
                    <small>Instructor</small>

                    <strong>
                      {getInstructor(selectedCourse)}
                    </strong>
                  </div>

                </div>

                <div className="course-modal-detail">

                  <FaClock />

                  <div>
                    <small>Duration</small>

                    <strong>
                      {getDuration(selectedCourse) || "Not specified"}
                    </strong>
                  </div>

                </div>

                <div className="course-modal-detail">

                  <FaGraduationCap />

                  <div>
                    <small>Enrollment</small>

                    <strong>
                      {getEnrollmentType(selectedCourse)}
                    </strong>
                  </div>

                </div>

                <div className="course-modal-detail">

                  <FaCheckCircle />

                  <div>
                    <small>Status</small>

                    <strong>
                      {getEnrollmentStatus(selectedCourse)}
                    </strong>
                  </div>

                </div>

                <div className="course-modal-detail">

                  <FaCalendarAlt />

                  <div>
                    <small>Enrolled On</small>

                    <strong>
                      {formatDate(
                        getEnrollmentDate(selectedCourse)
                      )}
                    </strong>
                  </div>

                </div>

                <div className="course-modal-detail">

                  {isPaidCourse(selectedCourse) ? (
                    <FaLock />
                  ) : (
                    <FaBookOpen />
                  )}

                  <div>
                    <small>Course Fee</small>

                    <strong>
                      {getCoursePrice(selectedCourse)}
                    </strong>
                  </div>

                </div>

              </div>

              {/* CONTINUE */}

              <button
                type="button"
                className="course-continue-button course-modal-continue"
                onClick={() =>
                  continueLearning(selectedCourse)
                }
                disabled={
                  getEnrollmentStatus(selectedCourse) !== "active"
                }
              >

                <FaPlay />

                <span>Continue Learning</span>

                <FaArrowRight />

              </button>

            </div>

          </section>

        </div>

      )}

    </main>
  );
};

export default MyCourseList;
