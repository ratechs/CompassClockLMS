// views/ui/TeacherStudentList.jsx (or StudentList.jsx)
import React, { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faBan,
  faTrophy,
  faEye,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { orderBy } from 'lodash';

const StudentList = () => {
  const { id: institutionId } = useParams(); // Institution ID from URL
  const navigate = useNavigate();

  const [studentsData, setStudentsData] = useState([]);
  const [studentsCount, setStudentCount] = useState(0);
  const [institutionDetails, setInstitutionDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: "",
    full_name: "",
    class: "",
    section: "",
    father_name: "",
    status: "",
    literacy_status: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
  console.log(studentsData)

  // ================================================================
  // FETCH STUDENTS BY INSTITUTION
  // ================================================================

  useEffect(() => {
    const fetchStudentsByInstitution = async () => {
      setLoading(true);
      try {
        // API endpoint to get students by institution
        const response = await axios.get(`/api/students/institution/${institutionId}`);
        console.log("Students fetched:", response.data.data);
        setStudentsData(orderBy(response.data.data, ['student_id'], ['asc']));
        setStudentCount(response.data.count);
      } catch (error) {
        console.error("Error fetching students:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Error fetching students. Please try again.";
        toast.error(errorMessage);
        setStudentsData([]);
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

  useEffect(() => {
    const instDetails = studentsData[0]?.school_info
    setInstitutionDetails(instDetails)
  }, [studentsData])

  // ================================================================
  // HANDLE FILTER CHANGES
  // ================================================================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // ================================================================
  // FILTER STUDENTS
  // ================================================================
  console.log(institutionDetails)
  const filteredStudents = useMemo(() => {
    // ✅ Check if studentsData is an array before filtering
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return [];
    }

    return studentsData.filter((student) => {
      // Search filters
      const matchesSearch =
        (!filters.student_id ||
          student.student_id
            ?.toLowerCase()
            .includes(filters.student_id.toLowerCase())) &&
        (!filters.full_name ||
          student.full_name
            ?.toLowerCase()
            .includes(filters.full_name.toLowerCase())) &&
        (!filters.class ||
          student.class?.toLowerCase().includes(filters.class.toLowerCase())) &&
        (!filters.section ||
          student.section?.toLowerCase().includes(filters.section.toLowerCase())) &&
        (!filters.father_name ||
          student.parent_info?.father?.name
            ?.toLowerCase()
            .includes(filters.father_name.toLowerCase())) &&
        (!filters.status ||
          student.status?.toLowerCase().includes(filters.status.toLowerCase()))

      return matchesSearch;
    });
  }, [studentsData, filters]);
  // ================================================================
  // PAGINATION
  // ================================================================

  const pageCount = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(start, start + studentsPerPage);
  }, [filteredStudents, currentPage]);

  // ================================================================
  // CRUD OPERATIONS
  // ================================================================

  const viewStudent = (student) => {
    navigate(`/teacher/students/${student.student_id}`);
  };

  const editStudent = (student) => {
    navigate(`/teacher/students/edit/${student.student_id}`);
  };

  const deleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.full_name}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/students/${student.student_id}`);
      setStudentsData((prev) =>
        prev.filter((s) => s.student_id !== student.student_id)
      );
      toast.success(`${student.full_name} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting student:", error);
      const errorMessage =
        error.response?.data?.message || "Error deleting student. Please try again.";
      toast.error(errorMessage);
    }
  };

  const updateStatus = async (student, newStatus) => {
    try {
      await axios.patch(`/api/students/${student.student_id}/status`, {
        status: newStatus,
      });
      setStudentsData((prev) =>
        prev.map((s) =>
          s.student_id === student.student_id ? { ...s, status: newStatus } : s
        )
      );
      toast.success(`Student status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status. Please try again.");
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  if (loading) {
    return (
      <div className="student-list-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-list-container">

      {/* =====================================================
        PAGE HEADER
    ===================================================== */}

      <div className="student-page-header">

        <div className="student-page-title">

          <div className="student-title-icon">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>

          <div>
            <h2>Student List</h2>

            <p>
              Manage and view students enrolled in this institution.
            </p>
          </div>

        </div>

        <div className="student-header-count">
          <FontAwesomeIcon icon={faUserGraduate} />
          <span>{studentsData.length}</span>
          <small>Students</small>
        </div>

      </div>


      {/* =====================================================
        INSTITUTION INFORMATION
    ===================================================== */}

      <div className="institution-info-card">

        <div className="institution-info-icon">
          <FontAwesomeIcon icon={faUserGraduate} />
        </div>

        <div className="institution-info-content">

          <span>Institution</span>

          <h4>
            {institutionDetails?.name?.name || "Institution"}
          </h4>

        </div>

        <div className="institution-total">

          <span>Total Students</span>

          <strong>
            {studentsCount}
          </strong>

        </div>

      </div>


      {/* =====================================================
        FILTER SECTION
    ===================================================== */}

      <div className="student-filter-card">

        <div className="student-filter-header">

          <div className="student-filter-title">

            <div className="filter-icon">
              <FontAwesomeIcon icon={faEye} />
            </div>

            <div>
              <h5>Student Filters</h5>
              <span>
                Find students quickly using the filters below
              </span>
            </div>

          </div>

          <div className="filter-result-count">
            {filteredStudents.length} Results
          </div>

        </div>


        <div className="student-filter-grid">

          {/* Student ID */}
          <div className="student-filter-field">

            <label>Student ID</label>

            <input
              type="text"
              name="student_id"
              placeholder="Search student ID"
              value={filters.student_id}
              onChange={handleFilterChange}
            />

          </div>


          {/* Name */}
          <div className="student-filter-field">

            <label>Student Name</label>

            <input
              type="text"
              name="full_name"
              placeholder="Search name"
              value={filters.full_name}
              onChange={handleFilterChange}
            />

          </div>


          {/* Class */}
          <div className="student-filter-field">

            <label>Class</label>

            <input
              type="text"
              name="class"
              placeholder="Search class"
              value={filters.class}
              onChange={handleFilterChange}
            />

          </div>


          {/* Section */}
          <div className="student-filter-field">

            <label>Section</label>

            <input
              type="text"
              name="section"
              placeholder="Search section"
              value={filters.section}
              onChange={handleFilterChange}
            />

          </div>


          {/* Father */}
          <div className="student-filter-field">

            <label>Father Name</label>

            <input
              type="text"
              name="father_name"
              placeholder="Search father name"
              value={filters.father_name}
              onChange={handleFilterChange}
            />

          </div>


          {/* Status */}
          <div className="student-filter-field">

            <label>Status</label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>

          </div>

        </div>

      </div>


      {/* =====================================================
        STUDENT TABLE
    ===================================================== */}

      <div className="student-table-card">

        <div className="student-table-header">

          <div>
            <h5>Students</h5>

            <span>
              Showing {paginatedStudents.length} of{" "}
              {filteredStudents.length} students
            </span>
          </div>

          <div className="student-table-badge">
            {filteredStudents.length}
          </div>

        </div>


        <div className="table-container-user">

          <table className="user-table-user">

            <thead className="table-header-user">

              <tr>

                <th className="header-cell-user">
                  Student
                </th>

                <th className="header-cell-user">
                  Roll Number
                </th>

                <th className="header-cell-user">
                  Class
                </th>

                <th className="header-cell-user">
                  Parent
                </th>

                <th className="header-cell-user">
                  Contact
                </th>

                <th className="header-cell-user">
                  Status
                </th>

                <th className="header-cell-user action-heading">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="table-body-user">

              {paginatedStudents.length > 0 ? (

                paginatedStudents.map((student) => (

                  <tr
                    key={
                      student._id ||
                      student.student_id
                    }
                    className="row-user"
                  >

                    {/* ======================================
                      STUDENT
                  ====================================== */}

                    <td className="cell-user">

                      <div className="student-profile">

                        <div className="student-avatar">

                          {student.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "S"}

                        </div>

                        <div className="student-profile-info">

                          <strong>
                            {student.full_name || "-"}
                          </strong>

                          <span>
                            ID: {student.student_id || "-"}
                          </span>

                        </div>

                      </div>

                    </td>


                    {/* ======================================
                      ROLL NUMBER
                  ====================================== */}

                    <td className="cell-user">

                      <span className="roll-number-badge">
                        {student.roll_number || "-"}
                      </span>

                    </td>


                    {/* ======================================
                      CLASS
                  ====================================== */}

                    <td className="cell-user">

                      <div className="class-section">

                        <strong>
                          {student.class || "-"}
                        </strong>

                        <span>
                          Section{" "}
                          {student.section
                            ?.toUpperCase() || "-"}
                        </span>

                      </div>

                    </td>


                    {/* ======================================
                      PARENT
                  ====================================== */}

                    <td className="cell-user">

                      <div className="parent-info">

                        <strong>
                          {student.parent_info?.father?.name ||
                            "-"}
                        </strong>

                        <span>
                          Father
                        </span>

                      </div>

                    </td>


                    {/* ======================================
                      CONTACT
                  ====================================== */}

                    <td className="cell-user">

                      <div className="parent-contact">

                        <span>
                          {student.parent_info?.father?.contact ||
                            "-"}
                        </span>

                        <span>
                          {student.parent_info?.mother?.contact ||
                            "-"}
                        </span>

                      </div>

                    </td>


                    {/* ======================================
                      STATUS
                  ====================================== */}

                    <td className="cell-user">

                      <span
                        className={`status-badge-user ${student.status === "active"
                            ? "active"
                            : student.status === "graduated"
                              ? "graduated"
                              : student.status === "transferred"
                                ? "transferred"
                                : student.status === "suspended"
                                  ? "suspended"
                                  : "inactive"
                          }`}
                      >

                        <span className="status-dot"></span>

                        {student.status || "Active"}

                      </span>

                    </td>


                    {/* ======================================
                      ACTIONS
                  ====================================== */}

                    <td className="cell-user">

                      <div className="student-actions">

                        {/* View */}
                        <button
                          type="button"
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


                        {/* Edit */}
                        <button
                          type="button"
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


                        {/* Activate / Deactivate */}
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              student,
                              student.status === "active"
                                ? "inactive"
                                : "active"
                            )
                          }
                          className={`student-action ${student.status === "active"
                              ? "deactivate"
                              : "activate"
                            }`}
                          title={
                            student.status === "active"
                              ? "Deactivate Student"
                              : "Activate Student"
                          }
                        >

                          <FontAwesomeIcon
                            icon={
                              student.status === "active"
                                ? faBan
                                : faTrophy
                            }
                          />

                        </button>


                        {/* Delete */}
                        <button
                          type="button"
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

                ))

              ) : (

                <tr className="empty-row-user">

                  <td
                    colSpan="7"
                    className="empty-cell-user"
                  >

                    <div className="student-empty-state">

                      <div className="empty-student-icon">
                        <FontAwesomeIcon
                          icon={faUserGraduate}
                        />
                      </div>

                      <h5>
                        No students found
                      </h5>

                      <p>
                        No students match the selected
                        filters.
                      </p>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
          PAGINATION
      ================================================= */}

        {pageCount > 1 && (

          <div className="student-pagination">

            <div className="pagination-summary">

              Showing{" "}
              <strong>
                {((currentPage - 1) *
                  studentsPerPage) +
                  1}
              </strong>{" "}
              -{" "}
              <strong>
                {Math.min(
                  currentPage *
                  studentsPerPage,
                  filteredStudents.length
                )}
              </strong>{" "}
              of{" "}
              <strong>
                {filteredStudents.length}
              </strong>

            </div>


            <div className="pagination-controls">

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev - 1
                  )
                }
                className="pagination-button-user"
              >
                Previous
              </button>


              <div className="pagination-page">

                <strong>
                  {currentPage}
                </strong>

                <span>
                  / {pageCount}
                </span>

              </div>


              <button
                type="button"
                disabled={
                  currentPage === pageCount
                }
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev + 1
                  )
                }
                className="pagination-button-user"
              >
                Next
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default StudentList;