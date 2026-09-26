import React, { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faBan,
  faCheck,
  faEye,
  faUserGraduate,
  faSearch,
  faFilter,
  faPlus,
  faUsers,
  faUserCheck,
  faUserSlash,
  faRotateLeft,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { orderBy } from "lodash";
const StudentList = () => {
  const { id: institutionId } = useParams();
  const navigate = useNavigate();

  const [studentsData, setStudentsData] = useState([]);
  const [studentsCount, setStudentCount] = useState(0);
  const [institutionDetails, setInstitutionDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    student_id: "",
    full_name: "",
    class: "",
    section: "",
    father_name: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const studentsPerPage = 10;

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  useEffect(() => {
    const fetchStudentsByInstitution = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `/api/students/institution/${institutionId}`
        );

        const students = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setStudentsData(
          orderBy(students, ["student_id"], ["asc"])
        );

        setStudentCount(response.data?.count || students.length);

        if (students.length > 0) {
          setInstitutionDetails(students[0]?.school_info || null);
        } else {
          setInstitutionDetails(null);
        }
      } catch (error) {
        console.error("Error fetching students:", error);

        toast.error(
          error.response?.data?.message ||
            "Error fetching students. Please try again."
        );

        setStudentsData([]);
        setStudentCount(0);
        setInstitutionDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (institutionId) {
      fetchStudentsByInstitution();
    } else {
      toast.error("Institution ID not found");
      setLoading(false);
    }
  }, [institutionId]);

  // =========================================================
  // FILTER CHANGE
  // =========================================================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setCurrentPage(1);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setFilters({
      student_id: "",
      full_name: "",
      class: "",
      section: "",
      father_name: "",
      status: "",
    });

    setCurrentPage(1);
  };

  const hasFilters = Object.values(filters).some(
    (value) => value !== ""
  );

  // =========================================================
  // FILTER STUDENTS
  // =========================================================

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(studentsData)) {
      return [];
    }

    return studentsData.filter((student) => {
      const studentId =
        student.student_id?.toString().toLowerCase() || "";

      const name =
        student.full_name?.toString().toLowerCase() || "";

      const studentClass =
        student.class?.toString().toLowerCase() || "";

      const section =
        student.section?.toString().toLowerCase() || "";

      const fatherName =
        student.parent_info?.father?.name
          ?.toString()
          .toLowerCase() || "";

      const status =
        student.status?.toString().toLowerCase() || "active";

      return (
        (!filters.student_id ||
          studentId.includes(
            filters.student_id.toLowerCase()
          )) &&
        (!filters.full_name ||
          name.includes(filters.full_name.toLowerCase())) &&
        (!filters.class ||
          studentClass.includes(filters.class.toLowerCase())) &&
        (!filters.section ||
          section.includes(filters.section.toLowerCase())) &&
        (!filters.father_name ||
          fatherName.includes(
            filters.father_name.toLowerCase()
          )) &&
        (!filters.status ||
          status === filters.status.toLowerCase())
      );
    });
  }, [studentsData, filters]);

  // =========================================================
  // STUDENT STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const active = studentsData.filter(
      (student) => (student.status || "active") === "active"
    ).length;

    const inactive = studentsData.filter(
      (student) => student.status === "inactive"
    ).length;

    const suspended = studentsData.filter(
      (student) => student.status === "suspended"
    ).length;

    return {
      total: studentsData.length,
      active,
      inactive,
      suspended,
    };
  }, [studentsData]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const pageCount = Math.ceil(
    filteredStudents.length / studentsPerPage
  );

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;

    return filteredStudents.slice(
      start,
      start + studentsPerPage
    );
  }, [filteredStudents, currentPage]);

  // =========================================================
  // CRUD
  // =========================================================

  const viewStudent = (student) => {
    navigate(`/teacher/students/${student.student_id}`);
  };

  const editStudent = (student) => {
    navigate(`/teacher/students/edit/${student.student_id}`);
  };

  const deleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.full_name}?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `/api/students/${student.student_id}`
      );

      setStudentsData((prev) =>
        prev.filter(
          (s) => s.student_id !== student.student_id
        )
      );

      setStudentCount((prev) =>
        Math.max(0, prev - 1)
      );

      toast.success(
        `${student.full_name} deleted successfully.`
      );
    } catch (error) {
      console.error("Error deleting student:", error);

      toast.error(
        error.response?.data?.message ||
          "Error deleting student. Please try again."
      );
    }
  };

  const updateStatus = async (student, newStatus) => {
    try {
      await axios.patch(
        `/api/students/${student.student_id}/status`,
        {
          status: newStatus,
        }
      );

      setStudentsData((prev) =>
        prev.map((s) =>
          s.student_id === student.student_id
            ? {
                ...s,
                status: newStatus,
              }
            : s
        )
      );

      toast.success(
        `Student status updated to ${newStatus}.`
      );
    } catch (error) {
      console.error("Error updating status:", error);

      toast.error(
        error.response?.data?.message ||
          "Error updating status. Please try again."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="student-list-page">
        <div className="student-loading">
          <div className="student-loading-spinner">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>

          <h5>Loading students...</h5>

          <p>
            Please wait while we load the student records.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="student-list-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="student-page-header">

        <div className="student-header-left">

          <div className="student-header-icon">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>

          <div>
            <div className="student-breadcrumb">
              Institution / Students
            </div>

            <h2>Student Management</h2>

            <p>
              Manage students, profiles and account status.
            </p>
          </div>

        </div>

        <button
          className="student-add-button"
          onClick={() =>
            navigate("/teacher/students/add")
          }
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Student</span>
        </button>

      </div>

      {/* =====================================================
          INSTITUTION INFO
      ====================================================== */}

      <div className="institution-card">

        <div className="institution-card-icon">
          <FontAwesomeIcon icon={faUsers} />
        </div>

        <div className="institution-card-content">
          <span>Institution</span>

          <strong>
            {institutionDetails?.name?.name ||
              institutionDetails?.name ||
              "Institution"}
          </strong>
        </div>

        <div className="institution-divider" />

        <div className="institution-stat">
          <span>Total Students</span>
          <strong>{studentsCount}</strong>
        </div>

      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="student-stat-grid">

        <div className="student-stat-card">
          <div className="student-stat-icon total">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div>
            <span>Total Students</span>
            <strong>{statistics.total}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon active">
            <FontAwesomeIcon icon={faUserCheck} />
          </div>

          <div>
            <span>Active</span>
            <strong>{statistics.active}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon inactive">
            <FontAwesomeIcon icon={faUserSlash} />
          </div>

          <div>
            <span>Inactive</span>
            <strong>{statistics.inactive}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon suspended">
            <FontAwesomeIcon icon={faBan} />
          </div>

          <div>
            <span>Suspended</span>
            <strong>{statistics.suspended}</strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          FILTER PANEL
      ====================================================== */}

      <div className="student-filter-card">

        <div className="student-filter-header">

          <div>
            <h5>
              <FontAwesomeIcon icon={faFilter} />
              Search & Filter
            </h5>

            <span>
              Find students using the filters below.
            </span>
          </div>

          {hasFilters && (
            <button
              className="clear-filter-button"
              onClick={clearFilters}
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              Clear Filters
            </button>
          )}

        </div>

        <div className="student-filter-grid">

          <div className="student-input-group">
            <label>Student ID</label>

            <div className="student-input-wrapper">
              <FontAwesomeIcon icon={faSearch} />

              <input
                type="text"
                name="student_id"
                placeholder="Search ID..."
                value={filters.student_id}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="student-input-group">
            <label>Student Name</label>

            <div className="student-input-wrapper">
              <FontAwesomeIcon icon={faSearch} />

              <input
                type="text"
                name="full_name"
                placeholder="Search name..."
                value={filters.full_name}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="student-input-group">
            <label>Class</label>

            <input
              type="text"
              name="class"
              placeholder="Class..."
              value={filters.class}
              onChange={handleFilterChange}
            />
          </div>

          <div className="student-input-group">
            <label>Section</label>

            <input
              type="text"
              name="section"
              placeholder="Section..."
              value={filters.section}
              onChange={handleFilterChange}
            />
          </div>

          <div className="student-input-group">
            <label>Father Name</label>

            <input
              type="text"
              name="father_name"
              placeholder="Father name..."
              value={filters.father_name}
              onChange={handleFilterChange}
            />
          </div>

          <div className="student-input-group">
            <label>Status</label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">
                Transferred
              </option>
              <option value="graduated">
                Graduated
              </option>
              <option value="suspended">
                Suspended
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* =====================================================
          TABLE CARD
      ====================================================== */}

      <div className="student-table-card">

        <div className="student-table-header">

          <div>
            <h5>Students</h5>

            <span>
              {filteredStudents.length} student
              {filteredStudents.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="student-result-badge">
            {filteredStudents.length} Results
          </div>

        </div>

        <div className="student-table-scroll">

          <table className="student-modern-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Class</th>
                <th>Parent</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="actions-heading">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {paginatedStudents.length > 0 ? (

                paginatedStudents.map((student) => {

                  const status =
                    student.status || "active";

                  return (
                    <tr
                      key={
                        student._id ||
                        student.student_id
                      }
                    >

                      {/* Student */}
                      <td>
                        <div className="student-profile-cell">

                          <div className="student-avatar">
                            {student.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <strong>
                              {student.full_name ||
                                "Unnamed Student"}
                            </strong>

                            <span>
                              ID:{" "}
                              {student.student_id ||
                                "-"}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* Roll */}
                      <td>
                        <span className="roll-badge">
                          {student.roll_number || "-"}
                        </span>
                      </td>

                      {/* Class */}
                      <td>
                        <div className="class-cell">

                          <strong>
                            {student.class || "-"}
                          </strong>

                          {student.section && (
                            <span>
                              Section{" "}
                              {student.section.toUpperCase()}
                            </span>
                          )}

                        </div>
                      </td>

                      {/* Parent */}
                      <td>
                        <div className="parent-cell">
                          <strong>
                            {student.parent_info?.father
                              ?.name || "-"}
                          </strong>

                          <span>
                            Father
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="contact-cell">

                          <span>
                            {student.parent_info?.father
                              ?.contact || "-"}
                          </span>

                          <span>
                            {student.parent_info?.mother
                              ?.contact || "-"}
                          </span>

                        </div>
                      </td>

                      {/* Status */}
                      <td>

                        <span
                          className={`student-status-badge ${status}`}
                        >
                          <span className="status-dot" />
                          {status}
                        </span>

                      </td>

                      {/* Actions */}
                      <td>

                        <div className="student-action-buttons">

                          <button
                            onClick={() =>
                              viewStudent(student)
                            }
                            className="student-action view"
                            title="View Student"
                          >
                            <FontAwesomeIcon
                              icon={faEye}
                            />
                          </button>

                          <button
                            onClick={() =>
                              editStudent(student)
                            }
                            className="student-action edit"
                            title="Edit Student"
                          >
                            <FontAwesomeIcon
                              icon={faEdit}
                            />
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                student,
                                status === "active"
                                  ? "inactive"
                                  : "active"
                              )
                            }
                            className={`student-action ${
                              status === "active"
                                ? "block"
                                : "activate"
                            }`}
                            title={
                              status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            <FontAwesomeIcon
                              icon={
                                status === "active"
                                  ? faBan
                                  : faCheck
                              }
                            />
                          </button>

                          <button
                            onClick={() =>
                              deleteStudent(student)
                            }
                            className="student-action delete"
                            title="Delete Student"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="student-empty-cell"
                  >

                    <div className="student-empty-state">

                      <div className="student-empty-icon">
                        <FontAwesomeIcon
                          icon={faUserGraduate}
                        />
                      </div>

                      <h5>
                        No students found
                      </h5>

                      <p>
                        No student records match your
                        current filters.
                      </p>

                      {hasFilters && (
                        <button
                          onClick={clearFilters}
                          className="empty-clear-button"
                        >
                          Clear Filters
                        </button>
                      )}

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            TABLE FOOTER
        ==================================================== */}

        <div className="student-table-footer">

          <span>
            Showing{" "}
            <strong>
              {paginatedStudents.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredStudents.length}
            </strong>{" "}
            students
          </span>

          {pageCount > 1 && (
            <div className="student-pagination">

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev - 1
                  )
                }
              >
                <FontAwesomeIcon
                  icon={faChevronLeft}
                />
              </button>

              <span>
                Page{" "}
                <strong>{currentPage}</strong>{" "}
                of{" "}
                <strong>{pageCount}</strong>
              </span>

              <button
                disabled={
                  currentPage === pageCount
                }
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev + 1
                  )
                }
              >
                <FontAwesomeIcon
                  icon={faChevronRight}
                />
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default StudentList;