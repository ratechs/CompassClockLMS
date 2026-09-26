import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Button,
  Container,
  Row,
  Col,
} from "reactstrap";

import defaultImage from "../../../assets/images/default_images/images.jpg";
import { useAuthcontext } from "../../../contexts/Authcontext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faPlus,
  faSearch,
  faPen,
  faTrash,
  faClock,
  faKey,
  faLayerGroup,
  faGraduationCap,
  faCircleCheck,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const { authUser } = useAuthcontext();

  /* =====================================================
     FETCH COURSES
  ===================================================== */

  useEffect(() => {
    const fetchCourses = async () => {
      if (!authUser?.user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get("/api/courses");

        const respondedCourses = Array.isArray(
          response.data
        )
          ? response.data
          : [];

        if (authUser?.user?.role === "teacher") {
          const teacherCourses =
            respondedCourses.filter(
              (course) =>
                course.created_by ===
                authUser?.user?._id
            );

          setCourses(teacherCourses);
        } else {
          setCourses(respondedCourses);
        }
      } catch (error) {
        console.error(
          "Error fetching courses:",
          error
        );

        const errorMessage =
          error.response?.data?.message ||
          "Error fetching courses. Please try again.";

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [authUser?.user?._id, authUser?.user?.role]);


  /* =====================================================
     DELETE COURSE
  ===================================================== */

  const handleDelete = async (courseId) => {
    if (!courseId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(courseId);

      await axios.delete(
        `/api/courses/${courseId}`
      );

      setCourses((prevCourses) =>
        prevCourses.filter(
          (course) =>
            course._id !== courseId
        )
      );

      toast.success(
        "Course deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Error deleting course:",
        error
      );

      const errorMessage =
        error.response?.data?.message ||
        "Error deleting course. Please try again.";

      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };


  /* =====================================================
     IMAGE VALIDATION
  ===================================================== */

  const isImageValid = (url) => {
    if (!url) return false;

    try {
      const parsed = new URL(url);

      const isHttp =
        parsed.protocol === "http:" ||
        parsed.protocol === "https:";

      const imagePattern =
        /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;

      return (
        isHttp &&
        (imagePattern.test(
          parsed.pathname
        ) ||
          parsed.hostname.includes(
            "gstatic.com"
          ))
      );
    } catch (error) {
      return false;
    }
  };


  /* =====================================================
     FILTER COURSES
  ===================================================== */

  const filteredCourses = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    if (!query) {
      return courses;
    }

    return courses.filter((course) => {
      const name =
        course.name?.toLowerCase() || "";

      const type =
        course.course_type?.toLowerCase() ||
        "";

      const joinCode =
        course.join_code?.toLowerCase() ||
        "";

      return (
        name.includes(query) ||
        type.includes(query) ||
        joinCode.includes(query)
      );
    });
  }, [courses, search]);


  /* =====================================================
     COURSE STATS
  ===================================================== */

  const totalCourses = courses.length;

  const publicCourses = courses.filter(
    (course) =>
      course.course_type === "public"
  ).length;

  const privateCourses = courses.filter(
    (course) =>
      course.course_type === "private"
  ).length;


  /* =====================================================
     UI
  ===================================================== */

  return (
    <Container
      fluid
      className="teacher-course-page"
    >

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="teacher-course-header">

        <div className="teacher-course-heading">

          <div className="teacher-course-title-icon">
            <FontAwesomeIcon
              icon={faBookOpen}
            />
          </div>

          <div>

            <div className="teacher-course-eyebrow">
              COURSE MANAGEMENT
            </div>

            <h1>
              My Courses
            </h1>

            <p>
              Create, manage and organize
              your learning courses.
            </p>

          </div>

        </div>


        <Link
          to="/teacher/create-course"
          className="teacher-course-add-link"
        >

          <Button className="teacher-course-add-btn">

            <FontAwesomeIcon
              icon={faPlus}
            />

            Add New Course

          </Button>

        </Link>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <Row className="teacher-course-stats">

        <Col
          xs="12"
          md="4"
        >

          <div className="teacher-course-stat-card">

            <div className="teacher-course-stat-icon total">
              <FontAwesomeIcon
                icon={faGraduationCap}
              />
            </div>

            <div>

              <span>
                Total Courses
              </span>

              <strong>
                {loading
                  ? "..."
                  : totalCourses}
              </strong>

            </div>

          </div>

        </Col>


        <Col
          xs="12"
          md="4"
        >

          <div className="teacher-course-stat-card">

            <div className="teacher-course-stat-icon public">
              <FontAwesomeIcon
                icon={faCircleCheck}
              />
            </div>

            <div>

              <span>
                Public Courses
              </span>

              <strong>
                {loading
                  ? "..."
                  : publicCourses}
              </strong>

            </div>

          </div>

        </Col>


        <Col
          xs="12"
          md="4"
        >

          <div className="teacher-course-stat-card">

            <div className="teacher-course-stat-icon private">
              <FontAwesomeIcon
                icon={faLayerGroup}
              />
            </div>

            <div>

              <span>
                Private Courses
              </span>

              <strong>
                {loading
                  ? "..."
                  : privateCourses}
              </strong>

            </div>

          </div>

        </Col>

      </Row>


      {/* =================================================
          MAIN CARD
      ================================================= */}

      <div className="teacher-course-card">

        {/* CARD HEADER */}

        <div className="teacher-course-card-header">

          <div>

            <h2>
              Course Library
            </h2>

            <p>
              {loading
                ? "Loading courses..."
                : `${filteredCourses.length} course${
                    filteredCourses.length !==
                    1
                      ? "s"
                      : ""
                  } available`}
            </p>

          </div>


          {/* SEARCH */}

          <div className="teacher-course-search">

            <FontAwesomeIcon
              icon={faSearch}
            />

            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="teacher-course-loading">

            <div className="teacher-course-loader">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h3>
              Loading courses
            </h3>

            <p>
              Please wait while we fetch
              your courses.
            </p>

          </div>

        ) : filteredCourses.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="teacher-course-empty">

            <div className="teacher-course-empty-icon">

              <FontAwesomeIcon
                icon={faBookOpen}
              />

            </div>

            {search ? (

              <>
                <h3>
                  No courses found
                </h3>

                <p>
                  No courses match
                  "{search}".
                </p>

                <button
                  type="button"
                  className="teacher-course-clear-btn"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  Clear Search
                </button>
              </>

            ) : (

              <>
                <h3>
                  No courses yet
                </h3>

                <p>
                  Create your first course
                  to start building your
                  learning content.
                </p>

                <Link
                  to="/teacher/create-course"
                  className="teacher-course-empty-btn"
                >

                  <FontAwesomeIcon
                    icon={faPlus}
                  />

                  Create Course

                </Link>
              </>

            )}

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="teacher-course-table-wrapper">

            <table className="teacher-course-table">

              <thead>

                <tr>

                  <th>
                    Course
                  </th>

                  <th>
                    Join Code
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Duration
                  </th>

                  <th className="actions-column">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredCourses.map(
                  (course) => {

                    const imageUrl =
                      isImageValid(
                        course.imageUrl
                      )
                        ? course.imageUrl
                        : defaultImage;

                    const isDeleting =
                      deletingId ===
                      course._id;

                    return (

                      <tr
                        key={course._id}
                      >

                        {/* COURSE */}

                        <td>

                          <div className="teacher-course-info">

                            <div className="teacher-course-image">

                              <img
                                src={imageUrl}
                                alt={
                                  course.name ||
                                  "Course"
                                }
                                onError={(e) => {
                                  e.currentTarget.src =
                                    defaultImage;
                                }}
                              />

                            </div>


                            <div className="teacher-course-name">

                              <strong>
                                {course.name ||
                                  "Untitled Course"}
                              </strong>

                              <span>
                                Course ID:{" "}
                                {course._id
                                  ?.slice(-8)
                                  .toUpperCase() ||
                                  "N/A"}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* JOIN CODE */}

                        <td>

                          <div className="teacher-course-code">

                            <FontAwesomeIcon
                              icon={faKey}
                            />

                            <span>
                              {course.join_code ||
                                "N/A"}
                            </span>

                          </div>

                        </td>


                        {/* TYPE */}

                        <td>

                          <span
                            className={`teacher-course-type ${
                              course.course_type ===
                              "private"
                                ? "private"
                                : "public"
                            }`}
                          >

                            <span className="teacher-course-type-dot"></span>

                            {course.course_type ||
                              "Unknown"}

                          </span>

                        </td>


                        {/* DURATION */}

                        <td>

                          <div className="teacher-course-duration">

                            <FontAwesomeIcon
                              icon={faClock}
                            />

                            <strong>
                              {course.duration ||
                                "0"}
                            </strong>

                            <span>
                              months
                            </span>

                          </div>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="teacher-course-actions">

                            <Link
                              to={`/teacher/edit-course/${course._id}`}
                              className="teacher-course-edit-link"
                            >

                              <Button
                                type="button"
                                className="teacher-course-edit-btn"
                                size="sm"
                              >

                                <FontAwesomeIcon
                                  icon={faPen}
                                />

                                <span>
                                  Edit
                                </span>

                              </Button>

                            </Link>


                            <Button
                              type="button"
                              className="teacher-course-delete-btn"
                              size="sm"
                              disabled={
                                isDeleting
                              }
                              onClick={() =>
                                handleDelete(
                                  course._id
                                )
                              }
                            >

                              <FontAwesomeIcon
                                icon={faTrash}
                              />

                              <span>
                                {isDeleting
                                  ? "Deleting..."
                                  : "Delete"}
                              </span>

                            </Button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          FOOTER INFO
      ================================================= */}

      {!loading &&
        courses.length > 0 && (
          <div className="teacher-course-footer">

            <div>

              <FontAwesomeIcon
                icon={faCircleCheck}
              />

              <span>
                Showing{" "}
                <strong>
                  {filteredCourses.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {courses.length}
                </strong>{" "}
                courses
              </span>

            </div>

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                Clear search
                <FontAwesomeIcon
                  icon={faArrowRight}
                />
              </button>
            )}

          </div>
        )}

    </Container>
  );
};

export default CourseList;