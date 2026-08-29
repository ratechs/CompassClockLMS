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

  useEffect(() =>{
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="list-heading-user h4 mb-0">
          <FontAwesomeIcon icon={faUserGraduate} className="me-2" />
          Student List
          <span className="badge bg-primary ms-2">
            {studentsData.length} Students
          </span>
        </h2>
        <div className="">
          <button
            className="btn btn-primary mx-1"
            onClick={() => navigate(`/teacher/students/add`)}
          >
            + Add Student
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/instructor/institutions/${institutionId}/students/upload`)}
          >
            + Upload Student
          </button>
        </div>
      </div>

      {/* Institution Info */}
      <div className="alert alert-info py-2 mb-3">
        <small>
          <strong>Institution:</strong> {institutionDetails?.name?.name} | 
          <strong> Total Students:</strong> {studentsCount}
        </small>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar mb-3">
        <div className="row g-2">
          <div className="col-md-2 col-6">
            <input
              type="text"
              name="student_id"
              placeholder="Student ID"
              value={filters.student_id}
              onChange={handleFilterChange}
              className="form-control form-control-sm"
            />
          </div>
          <div className="col-md-2 col-6">
            <input
              type="text"
              name="full_name"
              placeholder="Name"
              value={filters.full_name}
              onChange={handleFilterChange}
              className="form-control form-control-sm"
            />
          </div>
          <div className="col-md-2 col-6">
            <input
              type="text"
              name="class"
              placeholder="Class"
              value={filters.class}
              onChange={handleFilterChange}
              className="form-control form-control-sm"
            />
          </div>
          <div className="col-md-2 col-6">
            <input
              type="text"
              name="section"
              placeholder="Section"
              value={filters.section}
              onChange={handleFilterChange}
              className="form-control form-control-sm"
            />
          </div>
          <div className="col-md-2 col-6">
            <input
              type="text"
              name="father_name"
              placeholder="Father Name"
              value={filters.father_name}
              onChange={handleFilterChange}
              className="form-control form-control-sm"
            />
          </div>
          <div className="col-md-2 col-6">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-select form-select-sm"
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

      {/* Table */}
      <div className="table-container-user">
        <table className="user-table-user">
          <thead className="table-header-user">
            <tr>
              <th className="header-cell-user">Student ID</th>
              <th className="header-cell-user">Roll Number</th>
              <th className="header-cell-user">Name</th>
              <th className="header-cell-user">Class</th>
              <th className="header-cell-user">Father Name</th>
              <th className="header-cell-user">Parent Contact</th>
              <th className="header-cell-user">Status</th>
              <th className="header-cell-user">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body-user">
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <tr key={student._id || student.student_id} className="row-user">
                  <td className="cell-user">
                    <span className="fw-semibold">{student.student_id}</span>
                  </td>
                  
                  <td className="cell-user">
                    <span
                      className={`badge text-dark`}
                    >
                      {student.roll_number}
                    </span>
                  </td>
                  <td className="cell-user text-capitalize">
                    {student.full_name}
                  </td>
                  <td className="cell-user text-capitalize"><span className="badge text-dark">
                  {student.class} - {student.section.toUpperCase()}</span></td>
                  <td className="cell-user text-capitalize">
                    {student.parent_info?.father?.name || "-"}
                  </td>
                  <td className="cell-user text-capitalize">
                    {student.parent_info?.father?.contact || "-"} <br />
                    {student.parent_info?.mother?.contact || "-"}
                  </td>
                  <td className="cell-user">
                    <span
                      className={`status-badge-user ${
                        student.status === "active" ? "active" : "blocked"
                      } text-capitalize`}
                    >
                      {student.status || "Active"}
                    </span>
                  </td>
                  <td className="cell-user actions-cell-user text-nowrap">
                    <button
                      onClick={() => viewStudent(student)}
                      className="action-button-user text-primary"
                      title="View"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      onClick={() => editStudent(student)}
                      className="action-button-user edit-user"
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() =>
                        updateStatus(
                          student,
                          student.status === "active" ? "inactive" : "active"
                        )
                      }
                      className={`action-button-user ${
                        student.status === "active" ? "block-user" : "unblock-user"
                      }`}
                      title={student.status === "active" ? "Deactivate" : "Activate"}
                    >
                      <FontAwesomeIcon
                        icon={student.status === "active" ? faBan : faTrophy}
                      />
                    </button>
                    <button
                      onClick={() => deleteStudent(student)}
                      className="action-button-user block-trash"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="row-user empty-row-user">
                <td className="cell-user empty-cell-user" colSpan="8">
                  <div className="py-4">
                    <FontAwesomeIcon icon={faUserGraduate} className="fa-2x text-muted mb-2" />
                    <p className="mb-0">No students found in this institution.</p>
                    <small className="text-muted">Try adjusting your filters.</small>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="pagination-user my-3 d-flex justify-content-center align-items-center gap-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="pagination-button-user text-dark"
          >
            Previous
          </button>
          <span className="pagination-info-user">
            Page {currentPage} of {pageCount}
          </span>
          <button
            disabled={currentPage === pageCount}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="pagination-button-user text-dark"
          >
            Next
          </button>
        </div>
      )}

      {/* Count Summary */}
      <div className="text-muted text-end mt-2">
        <small>
          Showing {paginatedStudents.length} of {filteredStudents.length} students
        </small>
      </div>
    </div>
  );
};

export default StudentList;