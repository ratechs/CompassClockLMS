
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaClock,
  FaSearch,
  FaPlay,
  FaTimes,
  FaGraduationCap,
  FaArrowRight,
  FaExclamationCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Update these import paths to match your project.
import {CurrentUserService} from "../../../service/baseService";
import { useAuthcontext } from "contexts/Authcontext";
import DOMPurify from "dompurify";

const MyCourseList = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const {authUser} = useAuthcontext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch only the current user's course list.
  const fetchCourseList = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // If your service requires user course IDs, pass them here.
      const response = await CurrentUserService(authUser?.user);

      const result = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.courses)
          ? response.data.courses
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.courses)
              ? response.courses
              : [];
      console.log("CurrentUserService result:", response);
      // CurrentUserService should return only courses belonging to
      // the authenticated user. Do not load the public course catalogue here.
      setCourses(result);
    } catch (err) {
      console.error("Unable to load current user's courses:", err);
      setCourses([]);
      setError(
        err?.response?.data?.message ||
          "Unable to load your courses. Please try again."
      );
      toast.error(
        err?.response?.data?.message ||
          "Unable to load your courses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourseList();
  }, [fetchCourseList]);

  const getCourseId = (course) =>
    course?._id || course?.id || course?.courseId || "";

  const getCourseTitle = (course) =>
    course?.title ||
    course?.courseName ||
    course?.name ||
    "Untitled Course";

  const getCourseDescription = (course) =>
    course?.description ||
    course?.courseDescription ||
    "Continue learning and explore the materials available in this course.";

  const getCourseImage = (course) =>
    course?.thumbnail ||
    course?.image ||
    course?.imageUrl ||
    course?.courseImage ||
    "";

  const getCourseCategory = (course) =>
    course?.course_type ||
    "General";

  const getInstructor = (course) =>
    course?.created_by?.fullname ||
    "Course Instructor";

  const getRole = (course) =>
    course?.created_by?.role || "Student";

  const getDuration = (course) =>
    course?.duration || course?.courseDuration || "";

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(courses.map(getCourseCategory).filter(Boolean)),
    ];

    return ["All", ...uniqueCategories];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const title = getCourseTitle(course).toLowerCase();
      const description = getCourseDescription(course).toLowerCase();
      const category = String(getCourseCategory(course)).toLowerCase();
      const instructor = getInstructor(course).toLowerCase();

      const matchesSearch =
        !term ||
        title.includes(term) ||
        description.includes(term) ||
        category.includes(term) ||
        instructor.includes(term);

      const matchesCategory =
        selectedCategory === "All" ||
        getCourseCategory(course) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  // This is the only course action: no buying, payments, or enrollment.
  const continueLearning = (course) => {
    const courseId = getCourseId(course);

    if (!courseId) {
      toast.error("This course does not have a valid course ID.");
      return;
    }

    // Adjust this route to the course-learning page in your application.
    navigate(`/course/details/${course._id}`);
  };

  const closeModal = () => setSelectedCourse(null);

  if (loading) {
    return (
      <div className="my-course-page">
        <div className="course-loading">
          <div className="course-spinner" />
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="my-course-page">
        <div className="course-message">
          <FaExclamationCircle />
          <h2>Unable to load courses</h2>
          <p>{error}</p>
          <button
            type="button"
            className="course-primary-btn"
            onClick={fetchCourseList}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-course-page">
      <header className="my-course-header">
        <div>
          <span className="course-eyebrow">LEARNING DASHBOARD</span>
          <h1>My Courses</h1>
          <p>Access and continue learning from your courses.</p>
        </div>

        <div className="course-total">
          <FaGraduationCap />
          <div>
            <strong>{courses.length}</strong>
            <span>My Courses</span>
          </div>
        </div>
      </header>

      <section className="course-toolbar">
        <div className="course-search">
          <FaSearch />
          <input
            type="search"
            placeholder="Search your courses..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search your courses"
          />
        </div>

        <select
          className="course-category-select"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          aria-label="Filter by category"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All Categories" : category}
            </option>
          ))}
        </select>
      </section>

      {filteredCourses.length === 0 ? (
        <div className="course-message">
          <FaBookOpen />
          <h2>
            {courses.length === 0
              ? "No enrolled courses yet"
              : "No matching courses found"}
          </h2>
          <p>
            {courses.length === 0
              ? "Your enrolled courses will appear here when they are available in your account."
              : "Try another search term or category."}
          </p>

          {(searchTerm || selectedCategory !== "All") && (
            <button
              type="button"
              className="course-secondary-btn"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <section className="my-course-grid">
          {filteredCourses.map((course, index) => {
            const id = getCourseId(course) || `course-${index}`;
            const image = getCourseImage(course);

            return (
              <article className="my-course-card" key={id}>
                <div className="my-course-image">
                  {image ? (
                    <img src={image} alt={getCourseTitle(course)} />
                  ) : (
                    <div className="course-image-placeholder">
                      <FaBookOpen />
                    </div>
                  )}

                  <span className="course-enrolled-label">
                    My Course
                  </span>
                </div>

                <div className="my-course-card-body">
                  <span className="course-category-label text-capitalize">
                    {getCourseCategory(course)}
                  </span>

                  <h2>{getCourseTitle(course)}</h2>

                  <div
                    className="student-course-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        DOMPurify.sanitize(
                          getCourseDescription(course)
                        ),
                    }}
                  />

                  <div className="course-meta">
                    <div className="">
                      <span className = "text-capitalize">
                        <FaChalkboardTeacher />
                        {getInstructor(course)} ({getRole(course)})
                      </span>
                    </div>

                    {getDuration(course) && (
                      <span>
                        <FaClock />
                        {getDuration(course)}
                      </span>
                    )}
                  </div>

                  <div className="course-card-actions">
                    <button
                      type="button"
                      className="course-primary-btn"
                      onClick={() => continueLearning(course)}
                    >
                      <FaPlay />
                      Continue Learning
                      <FaArrowRight />
                    </button>

                    <button
                      type="button"
                      className="course-details-btn"
                      onClick={() => setSelectedCourse(course)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedCourse && (
        <div
          className="course-modal-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <section
            className="course-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="course-modal-close"
              onClick={closeModal}
              aria-label="Close course details"
            >
              Close
            </button>

            {getCourseImage(selectedCourse) && (
              <img
                className="course-modal-image"
                src={getCourseImage(selectedCourse)}
                alt={getCourseTitle(selectedCourse)}
              />
            )}

            <span className="course-category-label">
              {getCourseCategory(selectedCourse)}
            </span>

            <h2 id="course-modal-title">
              {getCourseTitle(selectedCourse)}
            </h2>

             <div
                className="course-modal-description"
                dangerouslySetInnerHTML={{
                  __html:
                    DOMPurify.sanitize(
                     getCourseDescription(selectedCourse)
                    ),
                }}
              />

            <div className="course-modal-meta">
              <p>
                <FaChalkboardTeacher /> {getInstructor(selectedCourse)}
              </p>

              {getDuration(selectedCourse) && (
                <p>
                  <FaClock /> {getDuration(selectedCourse)}
                </p>
              )}
            </div>

            <button
              type="button"
              className="course-primary-btn modal-continue-btn"
              onClick={() => continueLearning(selectedCourse)}
            >
              <FaPlay />
              Continue Learning
              <FaArrowRight />
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default MyCourseList;
