import React, { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaUserGraduate,
  FaBookOpen,
  FaCheckCircle,
  FaBan,
  FaEdit,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const StudentList = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [reffered, setReffereds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const studentsPerPage = 10;

  /* =====================================================
     GET CURRENT TEACHER
  ===================================================== */

  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("lms-user");

      if (!storedUser) return null;

      const parsedUser = JSON.parse(storedUser);

      return parsedUser?.user || parsedUser;
    } catch (error) {
      console.error("Unable to read logged-in user:", error);
      return null;
    }
  };

  /* =====================================================
     FETCH STUDENTS
  ===================================================== */

  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const currentUser = getCurrentUser();

      if (!currentUser?._id) {
        toast.error("Teacher information not found");
        return;
      }

      const response = await axios.get("/api/courses/");

      const courses = Array.isArray(response.data)
        ? response.data
        : response.data?.courses || [];

      /*
       * Only courses created by the logged-in teacher
       */
      const teacherCourses = courses.filter(
        (course) =>
          String(course?.created_by?._id || course?.created_by) ===
          String(currentUser._id)
      );

      /*
       * Deduplicate students
       */
      const studentMap = new Map();

      teacherCourses.forEach((course) => {
        const joinRequests = Array.isArray(course?.joinRequests)
          ? course.joinRequests
          : [];

        joinRequests.forEach((request) => {
          const student = request?.user;

          if (!student?._id) return;

          const studentId = String(student._id);

          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              ...student,

              requestedCourses: [
                {
                  id: course?._id,
                  name:
                    course?.course_name ||
                    course?.courseName ||
                    course?.name ||
                    "Untitled Course",
                  status: request?.status || "pending",
                },
              ],
            });
          } else {
            const existingStudent = studentMap.get(studentId);

            const alreadyAdded = existingStudent.requestedCourses.some(
              (item) => String(item.id) === String(course?._id)
            );

            if (!alreadyAdded) {
              existingStudent.requestedCourses.push({
                id: course?._id,
                name:
                  course?.course_name ||
                  course?.courseName ||
                  course?.name ||
                  "Untitled Course",
                status: request?.status || "pending",
              });
            }
          }
        });
      });

      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error("Error fetching students:", error);

      toast.error(
        error?.response?.data?.message || "Failed to load students"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);


  /* =====================================================
     STUDENT STATUS
  ===================================================== */

  const getStudentStatus = (student) => {
    if (student?.isActive === false) {
      return "blocked";
    }

    return "active";
  };

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentStatus = getStudentStatus(student);

      const fullName = student?.fullname || "";
      const username = student?.username || "";
      const email = student?.email || "";
      const phone = student?.phoneNumber
        ? String(student.phoneNumber)
        : "";

      const courseNames = (student?.requestedCourses || [])
        .map((course) => course?.name || "")
        .join(" ");

      const searchableText = `
        ${fullName}
        ${username}
        ${email}
        ${phone}
        ${courseNames}
      `.toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || studentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) => getStudentStatus(student) === "active"
  ).length;

  const blockedStudents = students.filter(
    (student) => getStudentStatus(student) === "blocked"
  ).length;

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * studentsPerPage;

  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  /* =====================================================
     UPDATE STUDENT STATUS
  ===================================================== */

  const updateStudentStatus = async (student) => {
    if (!student?._id) return;

    const currentStatus = getStudentStatus(student);

    const newStatus = currentStatus === "active" ? "blocked" : "active";

    try {
      await axios.put(
        `/api/users/update-userStatus/${student._id}`,
        {
          isActive: newStatus === "active",
        }
      );

      toast.success(
        newStatus === "active"
          ? "Student activated successfully"
          : "Student blocked successfully"
      );

      setStudents((prevStudents) =>
        prevStudents.map((item) =>
          String(item._id) === String(student._id)
            ? {
                ...item,
                isActive: newStatus === "active",
              }
            : item
        )
      );
    } catch (error) {
      console.error("Status update error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to update student status"
      );
    }
  };

  /* =====================================================
     VIEW STUDENT
  ===================================================== */

  const handleViewStudent = (student) => {
    if (!student?._id) return;

    navigate(`/teacher/users/${student._id}`);
  };

  /* =====================================================
     EDIT STUDENT
  ===================================================== */

  const handleEditStudent = (student) => {
    if (!student?._id) return;

    navigate(`/teacher/users/edit/${student._id}`);
  };

  /* =====================================================
     PAGE CHANGE
  ===================================================== */

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="student-list-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="student-list-header">

        <div>
          <div className="student-list-title-row">
            <div className="student-list-title-icon">
              <FaUserGraduate />
            </div>

            <div>
              <h2>Students</h2>

              <p>
                Manage and monitor students enrolled in your courses
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`student-refresh-btn ${
            refreshing ? "refreshing" : ""
          }`}
          onClick={() => fetchStudents(true)}
          disabled={refreshing}
        >
          <FaSyncAlt />

          <span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="student-stat-grid">

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaUserGraduate />
          </div>

          <div>
            <span>Total Students</span>
            <strong>{totalStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaCheckCircle />
          </div>

          <div>
            <span>Active Students</span>
            <strong>{activeStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaBan />
          </div>

          <div>
            <span>Blocked Students</span>
            <strong>{blockedStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaBookOpen />
          </div>

          <div>
            <span>Reffered</span>
            <strong>{filteredStudents.length}</strong>
          </div>
        </div>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="student-filter-card">

        <div className="student-search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Search student, email, phone or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              className="student-search-clear"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        <div className="student-status-filters">

          <button
            type="button"
            className={
              statusFilter === "all"
                ? "student-filter active"
                : "student-filter"
            }
            onClick={() => setStatusFilter("all")}
          >
            All
            <span>{totalStudents}</span>
          </button>

          <button
            type="button"
            className={
              statusFilter === "active"
                ? "student-filter active"
                : "student-filter"
            }
            onClick={() => setStatusFilter("active")}
          >
            Active
            <span>{activeStudents}</span>
          </button>

          <button
            type="button"
            className={
              statusFilter === "blocked"
                ? "student-filter active"
                : "student-filter"
            }
            onClick={() => setStatusFilter("blocked")}
          >
            Blocked
            <span>{blockedStudents}</span>
          </button>

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="student-table-card">

        {loading ? (
          <div className="student-loading">

            <div className="student-spinner"></div>

            <p>Loading students...</p>

          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="student-empty">

            <div className="student-empty-icon">
              <FaUserGraduate />
            </div>

            <h3>No students found</h3>

            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Students from your courses will appear here."}
            </p>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}

          </div>
        ) : (
          <>

            <div className="student-table-wrapper">

              <table className="student-table">

                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Courses</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {paginatedStudents.map((student) => {

                    const status = getStudentStatus(student);

                    return (
                      <tr key={student._id}>

                        {/* STUDENT */}

                        <td>

                          <div className="student-profile">

                            <div className="student-avatar">

                              {student?.profilePicture ? (
                                <img
                                  src={student.profilePicture}
                                  alt={student?.fullname || "Student"}
                                />
                              ) : (
                                <span>
                                  {(
                                    student?.fullname ||
                                    student?.username ||
                                    "S"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}

                            </div>

                            <div className="student-profile-info">

                              <strong>
                                {student?.fullname || "Unnamed Student"}
                              </strong>

                              <span>
                                {student?.username || "-"}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* CONTACT */}

                        <td>

                          <div className="student-contact">

                            <span>
                              {student?.email || "-"}
                            </span>

                            <small>
                              {student?.phoneNumber || "-"}
                            </small>

                          </div>

                        </td>

                        {/* COURSES */}

                        <td>

                          <div className="student-course-list">

                            {student?.requestedCourses?.length > 0 ? (
                              <>
                                {student.requestedCourses
                                  .slice(0, 2)
                                  .map((course) => (
                                    <span
                                      className="student-course-badge"
                                      key={course.id}
                                      title={course.name}
                                    >
                                      <FaBookOpen />
                                      {course.name}
                                    </span>
                                  ))}

                                {student.requestedCourses.length > 2 && (
                                  <span className="student-more-courses">
                                    +{student.requestedCourses.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="student-no-course">
                                No course
                              </span>
                            )}

                          </div>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`student-status ${status}`}
                          >
                            <span className="student-status-dot"></span>

                            {status === "active"
                              ? "Active"
                              : "Blocked"}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="student-actions">

                            <button
                              type="button"
                              className="student-action view"
                              title="View Student"
                              onClick={() =>
                                handleViewStudent(student)
                              }
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              className="student-action edit"
                              title="Edit Student"
                              onClick={() =>
                                handleEditStudent(student)
                              }
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              className={`student-action ${
                                status === "active"
                                  ? "block"
                                  : "activate"
                              }`}
                              title={
                                status === "active"
                                  ? "Block Student"
                                  : "Activate Student"
                              }
                              onClick={() =>
                                updateStudentStatus(student)
                              }
                            >
                              {status === "active" ? (
                                <FaBan />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="student-pagination">

              <div className="student-pagination-info">

                Showing{" "}
                <strong>
                  {filteredStudents.length === 0
                    ? 0
                    : startIndex + 1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(
                    startIndex + studentsPerPage,
                    filteredStudents.length
                  )}
                </strong>{" "}
                of{" "}
                <strong>{filteredStudents.length}</strong>{" "}
                students

              </div>

              <div className="student-pagination-controls">

                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() =>
                    changePage(safeCurrentPage - 1)
                  }
                >
                  <FaChevronLeft />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .slice(
                    Math.max(0, safeCurrentPage - 3),
                    Math.min(totalPages, safeCurrentPage + 2)
                  )
                  .map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={
                        safeCurrentPage === page
                          ? "active"
                          : ""
                      }
                      onClick={() => changePage(page)}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() =>
                    changePage(safeCurrentPage + 1)
                  }
                >
                  <FaChevronRight />
                </button>

              </div>

            </div>

          </>
        )}

      </div>

    </div>
  );
};

export default StudentList;