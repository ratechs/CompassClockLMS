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

  // =====================================================
  // STATE
  // =====================================================
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [screenWidth, setScreenWidth] = useState(90);

  const studentsPerPage = 10;

  // =====================================================
  // FETCH REFERRALS AND MAP API RESPONSE
  // =====================================================
  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get("/api/affiliates/referrals", {
        withCredentials: true,
      });

      console.log("Affiliate referrals response:", response.data);

      // Supports { data: { referrals: [] } } and { referrals: [] }
      const referrals =
        response.data?.data?.referrals ||
        response.data?.referrals ||
        [];

      const mappedStudents = referrals
        .filter((referral) => referral?.student)
        .map((referral) => {
          const student = referral.student;

          return {
            // Student fields
            ...student,

            // Referral fields
            referralId: referral.referralId,
            referralCode: referral.referralCode,
            registeredAt: referral.registeredAt,

            // Conversion details
            conversionStatus:
              referral.conversionStatus || "registered",

            paidOrders: referral.paidOrders || [],
            enrollments: referral.enrollments || [],

            // Used by the existing course UI
            requestedCourses: [
              ...(referral.enrollments || []).map((enrollment) => ({
                id: enrollment._id,
                name:
                  enrollment.course?.title ||
                  enrollment.course?.name ||
                  enrollment.course?.courseName ||
                  "Enrolled course",
              })),
            ],

            // Retain the actual student's active status
            isActive: student.isActive !== false,
          };
        });

      

      setStudents(mappedStudents);
      setScreenWidth(85);
    } catch (error) {
      console.error("Error fetching referrals:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to load referred students"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // =====================================================
  // REFERRAL STATUS
  // =====================================================
  const getReferralStatus = (student) => {
    return student.conversionStatus === "converted"
      ? "converted"
      : "registered";
  };

  const getStudentStatus = (student) => {
    return student.isActive === false ? "blocked" : "active";
  };

  // =====================================================
  // STATISTICS
  // =====================================================
  const totalStudents = students.length;

  const registeredStudents = students.filter(
    (student) => getReferralStatus(student) === "registered"
  ).length;

  const convertedStudents = students.filter(
    (student) => getReferralStatus(student) === "converted"
  ).length;

  const activeStudents = students.filter(
    (student) => getStudentStatus(student) === "active"
  ).length;

  const blockedStudents = students.filter(
    (student) => getStudentStatus(student) === "blocked"
  ).length;

  // =====================================================
  // SEARCH AND FILTER
  // =====================================================
  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return students.filter((student) => {
      const searchableText = [
        student.fullname,
        student.username,
        student.email,
        student.phoneNumber,
        student.referralCode,
        student.conversionStatus,
        ...(student.requestedCourses || []).map(
          (course) => course.name
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        getReferralStatus(student) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  // =====================================================
  // PAGINATION
  // =====================================================
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

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // =====================================================
  // UPDATE STUDENT ACTIVE STATUS
  // =====================================================
  const updateStudentStatus = async (student) => {
    if (!student?._id) return;

    const newIsActive = student.isActive === false;

    try {
      await axios.put(
        `/api/users/update-userStatus/${student._id}`,
        { isActive: newIsActive },
        { withCredentials: true }
      );

      toast.success(
        newIsActive
          ? "Student activated successfully"
          : "Student blocked successfully"
      );

      setStudents((previous) =>
        previous.map((item) =>
          String(item._id) === String(student._id)
            ? { ...item, isActive: newIsActive }
            : item
        )
      );
    } catch (error) {
      console.error("Student status update error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to update student status"
      );
    }
  };

  // =====================================================
  // STUDENT ACTIONS
  // =====================================================
  const handleViewStudent = (student) => {
    if (!student?._id) return;
    navigate(`/teacher/users/${student._id}`);
  };

  const handleEditStudent = (student) => {
    if (!student?._id) return;
    navigate(`/teacher/users/edit/${student._id}`);
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="student-list-page" style={{ width: `${screenWidth}%` }}>
      {/* HEADER */}
      <div className="student-list-header">
        <div className="student-list-title-row">
          <div className="student-list-title-icon">
            <FaUserGraduate />
          </div>

          <div>
            <h2>Referred Students</h2>
            <p>
              Manage students registered through your referral link
            </p>
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
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* STATISTICS */}
      <div className="student-stat-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaUserGraduate />
          </div>
          <div>
            <span>Total Referred</span>
            <strong>{totalStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaBookOpen />
          </div>
          <div>
            <span>Registered</span>
            <strong>{registeredStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaCheckCircle />
          </div>
          <div>
            <span>Converted</span>
            <strong>{convertedStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">
            <FaUserGraduate />
          </div>
          <div>
            <span>Active Accounts</span>
            <strong>{activeStudents}</strong>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="student-filter-card">
        <div className="student-search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Search name, email, phone or referral code..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
          {[
            { value: "all", label: "All", count: totalStudents },
            {
              value: "registered",
              label: "Registered",
              count: registeredStudents,
            },
            {
              value: "converted",
              label: "Converted",
              count: convertedStudents,
            },
          ].map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={`student-filter ${
                statusFilter === filter.value ? "active" : ""
              }`}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="student-table-card">
        {loading ? (
          <div className="student-loading">
            <div className="student-spinner" />
            <p>Loading referred students...</p>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="student-empty">
            <div className="student-empty-icon">
              <FaUserGraduate />
            </div>

            <h3>No referred students found</h3>
            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Students who register using your referral link will appear here."}
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
                    <th>Referral Details</th>
                    <th>Courses</th>
                    <th>Conversion</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedStudents.map((student) => {
                    const status = getReferralStatus(student);
                    const accountStatus = getStudentStatus(student);

                    return (
                      <tr
                        key={student.referralId || student._id}
                      >
                        {/* STUDENT */}
                        <td>
                          <div className="student-profile">
                            <div className="student-avatar">
                              {student.profilePicture ? (
                                <img
                                  src={student.profilePicture}
                                  alt={student.fullname || "Student"}
                                />
                              ) : (
                                <span>
                                  {(
                                    student.fullname ||
                                    student.username ||
                                    "S"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="student-profile-info">
                              <strong>
                                {student.fullname || "Unnamed Student"}
                              </strong>
                              <span>{student.username || "-"}</span>
                              <small>
                                Joined: {formatDate(student.createdAt)}
                              </small>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td>
                          <div className="student-contact">
                            <span>{student.email || "-"}</span>
                            <small>{student.phoneNumber || "-"}</small>
                          </div>
                        </td>

                        {/* REFERRAL DETAILS */}
                        <td>
                          <div className="student-contact">
                            <strong>
                              {student.referralCode || "-"}
                            </strong>
                            <small>
                              Referred: {formatDate(student.registeredAt)}
                            </small>
                          </div>
                        </td>

                        {/* COURSES */}
                        <td>
                          <div className="student-course-list">
                            {student.requestedCourses?.length > 0 ? (
                              <>
                                {student.requestedCourses
                                  .slice(0, 2)
                                  .map((course, index) => (
                                    <span
                                      className="student-course-badge"
                                      key={course.id || index}
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
                                No enrollment
                              </span>
                            )}
                          </div>
                        </td>

                        {/* CONVERSION */}
                        <td>
                          <span
                            className={`student-status ${
                              status === "converted"
                                ? "active"
                                : "registered"
                            }`}
                          >
                            <span className="student-status-dot" />
                            {status === "converted"
                              ? "Converted"
                              : "Registered"}
                          </span>

                          <small
                            style={{
                              display: "block",
                              marginTop: "6px",
                              color:
                                accountStatus === "blocked"
                                  ? "#dc2626"
                                  : "#64748b",
                            }}
                          >
                            Account:{" "}
                            {accountStatus === "blocked"
                              ? "Blocked"
                              : "Active"}
                          </small>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="student-actions">
                            <button
                              type="button"
                              className="student-action view"
                              title="View Student"
                              onClick={() => handleViewStudent(student)}
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              className="student-action edit"
                              title="Edit Student"
                              onClick={() => handleEditStudent(student)}
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              className={`student-action ${
                                accountStatus === "active"
                                  ? "block"
                                  : "activate"
                              }`}
                              title={
                                accountStatus === "active"
                                  ? "Block Student"
                                  : "Activate Student"
                              }
                              onClick={() => updateStudentStatus(student)}
                            >
                              {accountStatus === "active" ? (
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

            {/* PAGINATION */}
            <div className="student-pagination">
              <div className="student-pagination-info">
                Showing{" "}
                <strong>
                  {filteredStudents.length === 0 ? 0 : startIndex + 1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(
                    startIndex + studentsPerPage,
                    filteredStudents.length
                  )}
                </strong>{" "}
                of <strong>{filteredStudents.length}</strong> students
              </div>

              <div className="student-pagination-controls">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => changePage(safeCurrentPage - 1)}
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
                        safeCurrentPage === page ? "active" : ""
                      }
                      onClick={() => changePage(page)}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => changePage(safeCurrentPage + 1)}
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