import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Table,
  Button,
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Input,
} from "reactstrap";

import defaultImage from "../../../assets/images/default_images/images.jpg";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Fetch Courses
  // --------------------------------------------------
  const fetchCourses = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/courses");

      setCourses(response.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch courses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Delete Course
  // --------------------------------------------------
  const handleDelete = async (courseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/courses/${courseId}`);

      // Remove deleted course from state
      setCourses((previousCourses) =>
        previousCourses.filter((course) => course._id !== courseId)
      );

      toast.success("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete course. Please try again."
      );
    }
  };

  // --------------------------------------------------
  // Check whether image URL is valid
  // --------------------------------------------------
  const getCourseImage = (imageUrl) => {
    if (!imageUrl) {
      return defaultImage;
    }

    try {
      const url = new URL(imageUrl);

      const isHttp =
        url.protocol === "http:" || url.protocol === "https:";

      const imageExtension =
        /\.(jpg|jpeg|png|gif|bmp|webp)$/i;

      const isImage =
        imageExtension.test(url.pathname) ||
        url.hostname.includes("gstatic.com");

      return isHttp && isImage ? imageUrl : defaultImage;
    } catch {
      return defaultImage;
    }
  };

  // --------------------------------------------------
  // Fetch courses when component loads
  // --------------------------------------------------
  useEffect(() => {
    fetchCourses();
  }, []);

  // --------------------------------------------------
  // Search Courses
  // --------------------------------------------------
  const filteredCourses = courses.filter((course) => {
    const courseName = course?.name || "";

    return courseName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  return (
    <Container fluid className="px-2 px-md-3 mt-2">
      <Row>
        <Col xs="12">
          <Card className="border-0 shadow-sm rounded-4">
            <CardBody className="p-3 p-md-4">

              {/* ----------------------------------------
                  Header
              ----------------------------------------- */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                <div>
                  <CardTitle
                    tag="h4"
                    className="mb-1 fw-bold"
                  >
                    Courses
                  </CardTitle>

                  <p className="text-muted mb-0 small">
                    Manage and view all available courses
                  </p>
                </div>

                <div className="d-flex flex-column flex-sm-row gap-2">

                  {/* Search */}
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="course-search"
                  />

                  {/* Add Course */}
                  <Link
                    to="/instructor/create-course"
                    className="text-decoration-none"
                  >
                    <Button
                      color="primary"
                      className="w-100 btn-gradient"
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      Add New
                    </Button>
                  </Link>

                </div>
              </div>

              {/* ----------------------------------------
                  Loading
              ----------------------------------------- */}
              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  >
                    <span className="visually-hidden">
                      Loading...
                    </span>
                  </div>

                  <p className="text-muted mt-3 mb-0">
                    Loading courses...
                  </p>
                </div>
              ) : courses.length === 0 ? (
                /* ----------------------------------------
                   No Courses
                ----------------------------------------- */
                <div className="text-center py-5">

                  <div className="mb-3">
                    <i
                      className="bi bi-book fs-1 text-muted"
                    ></i>
                  </div>

                  <h5>No courses available</h5>

                  <p className="text-muted mb-3">
                    Create your first course to get started.
                  </p>

                  <Link to="/instructor/create-course">
                    <Button color="primary" className="btn-gradient">
                      <i className="bi bi-plus-lg me-1"></i>
                      Add Course
                    </Button>
                  </Link>

                </div>
              ) : filteredCourses.length === 0 ? (
                /* ----------------------------------------
                   No Search Results
                ----------------------------------------- */
                <div className="text-center py-5">

                  <i
                    className="bi bi-search fs-1 text-muted"
                  ></i>

                  <h5 className="mt-3">
                    No courses found
                  </h5>

                  <p className="text-muted mb-0">
                    Try searching with a different course name.
                  </p>

                </div>
              ) : (
                /* ----------------------------------------
                   Course Table
                ----------------------------------------- */

                <div className="course-table-wrapper">

                  <Table
                    responsive
                    hover
                    borderless
                    className="align-middle mb-0"
                  >

                    {/* Table Header */}
                    <thead className="table-light">
                      <tr>
                        <th className="text-nowrap">
                          Image
                        </th>

                        <th className="text-nowrap">
                          Course Name
                        </th>

                        <th className="text-nowrap">
                          Join Code
                        </th>

                        <th className="text-nowrap">
                          Course Type
                        </th>

                        <th className="text-nowrap">
                          Duration
                        </th>

                        <th className="text-nowrap text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {filteredCourses.map((course) => (

                        <tr key={course._id}>

                          {/* Image */}
                          <td>
                            <img
                              src={getCourseImage(
                                course.imageUrl
                              )}
                              alt={course.name || "Course"}
                              className="course-image-list"
                            />
                          </td>

                          {/* Course Name */}
                          <td>
                            <div className="course-name">
                              {course.name || "Untitled Course"}
                            </div>
                          </td>

                          {/* Join Code */}
                          <td>
                            <span className="join-code">
                              {course.join_code || "-"}
                            </span>
                          </td>

                          {/* Course Type */}
                          <td>
                            <span className="text-capitalize">
                              {course.course_type || "-"}
                            </span>
                          </td>

                          {/* Duration */}
                          <td>
                            {course.duration || "-"}
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="d-flex justify-content-center gap-2">

                              {/* Edit */}
                              <Link
                                to={`/instructor/edit-course/${course._id}`}
                              >
                                <Button
                                  color="warning"
                                  size="sm"
                                  className="action-button"
                                  title="Edit Course"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </Button>
                              </Link>

                              {/* Delete */}
                              <Button
                                color="danger"
                                size="sm"
                                className="action-button"
                                title="Delete Course"
                                onClick={() =>
                                  handleDelete(course._id)
                                }
                              >
                                <i className="bi bi-trash-fill"></i>
                              </Button>

                            </div>
                          </td>

                        </tr>

                      ))}
                    </tbody>

                  </Table>

                </div>
              )}

              {/* ----------------------------------------
                  Footer Information
              ----------------------------------------- */}
              {!loading && courses.length > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3 pt-3 border-top">

                  <small className="text-muted">
                    Showing{" "}
                    <strong>
                      {filteredCourses.length}
                    </strong>{" "}
                    of{" "}
                    <strong>{courses.length}</strong>{" "}
                    courses
                  </small>

                  {searchTerm && (
                    <Button
                      color="link"
                      size="sm"
                      className="p-0 text-decoration-none"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear search
                    </Button>
                  )}

                </div>
              )}

            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CourseList;