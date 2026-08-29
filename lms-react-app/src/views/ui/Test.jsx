import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTests } from "../../hooks/Tests/useTest";
import { useCourse } from "../../hooks/Courses/useCourses";
import { Button } from "reactstrap";
import { useDeleteTests } from "../../hooks/Tests/deleteTest";
import { useTestStatusChange } from "../../hooks/Tests/testStatusChange";
import toast from "react-hot-toast";

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  addButton: {
    backgroundColor: "#000000",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    background: "#fff",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    minWidth: "700px",
  },
  th: {
    padding: "12px",
    backgroundColor: "#f4f4f4",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontWeight: "600",
    borderBottom: "2px solid #ddd",
  },
  td: {
    padding: "12px",
    textTransform: "capitalize",
    borderBottom: "1px solid #eee",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  enabledBadge: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  disabledBadge: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  draftBadge: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
  archivedBadge: {
    backgroundColor: "#e2e3e5",
    color: "#383d41",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    fontSize: "18px",
    color: "#666",
  },
};

const TestOverview = () => {
  const navigate = useNavigate();
  const { tests, loading, error, refetch } = useTests();
  const { deleteTest } = useDeleteTests();
  const { changeStatus } = useTestStatusChange();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTests, setFilteredTests] = useState([]);
  console.log("the testd data", tests)
  useEffect(() => {
    if (tests?.data) {
      const filtered = tests.data.filter((test) =>
        (test.title || test.test_name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTests(filtered);
    }
  }, [tests, searchTerm]);

  const handleEdit = (id) => {
    if (id) {
      navigate(`/instructor/test/${id}`);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    
    if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      try {
        await deleteTest(id);
        toast.success("Test deleted successfully");
         // Refresh the list
      } catch (error) {
        toast.error(error.message || "Failed to delete test");
      }
    }
  };

  const handleAddTest = () => {
    navigate("/instructor/test/new");
  };

  const handleStatusChange = async (testId, currentStatus) => {
    if (!testId) return;
    
    const newStatus = currentStatus === "enabled" ? "disabled" : "enabled";
    try {
      await changeStatus(testId, newStatus);
      toast.success(`Test ${newStatus === "enabled" ? "enabled" : "disabled"} successfully`);
       // Refresh the list
    } catch (error) {
      toast.error(error.message || "Failed to change test status");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      enabled: { ...styles.statusBadge, ...styles.enabledBadge },
      disabled: { ...styles.statusBadge, ...styles.disabledBadge },
      draft: { ...styles.statusBadge, ...styles.draftBadge },
      archived: { ...styles.statusBadge, ...styles.archivedBadge },
    };
    return statusMap[status] || statusMap.draft;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span style={{ marginLeft: "10px" }}>Loading tests...</span>
        </div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div style={styles.container}>
  //       <div className="alert alert-danger" role="alert">
  //         <h4 className="alert-heading">Error Loading Tests</h4>
  //         <p>{error.message || "Failed to load tests. Please try again."}</p>
  //         <Button color="primary" onClick={refetch}>
  //           Retry
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div style={styles.container}>
      <style>
        {`
          @media (max-width: 600px) {
            .test-header-controls {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 8px !important;
            }
            .test-header-controls input,
            .test-header-controls button {
              width: 100% !important;
              max-width: 100% !important;
            }
            .test-table-wrapper {
              margin-top: 10px;
            }
          }
        `}
      </style>

      <div style={styles.headerContainer} className="test-header-controls">
        <h5>
          <b>Test Overview</b>
          <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666", marginLeft: "10px" }}>
            ({filteredTests.length} tests)
          </span>
        </h5>
        <div className="d-flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search Tests..."
            className="form-control"
            style={{ maxWidth: "200px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button style={styles.addButton} onClick={handleAddTest}>
            <i className="bi bi-plus-circle"></i> Add Test
          </button>
        </div>
      </div>

      <div style={styles.tableWrapper} className="test-table-wrapper">
        {filteredTests.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Test Name</th>
                <th style={styles.th}>Test Type</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Lesson</th>
                <th style={styles.th}>Created By</th>
                <th style={styles.th}>Questions</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test, index) => {
                // Get the correct field names (support both old and new field names)
                const testName = test.title || test.test_name || "Untitled";
                const testSubject = test.category?.name || test.test_subject?.name || "N/A";
                const testLesson = test.sub_category?.name || test.test_lesson?.name || "N/A";
                const createdBy = test.created_by?.username || test.created_by?.name || "Admin";
                const createdByRole = test.created_by?.role || "";
                const questionsCount = test.test_questions?.length || test.questions?.length || 0;
                const status = test.test_status || "draft";
                const testType = test.test_type || "N/A";
                const testId = test._id;

                return (
                  <tr key={testId || index}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{testName}</strong>
                    </td>
                    <td style={styles.td}>
                      <span className="badge bg-info text-white">
                        {testType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={styles.td}>{testSubject}</td>
                    <td style={styles.td}>{testLesson}</td>
                    <td style={styles.td}>
                      {createdBy}
                      {createdByRole && (
                        <span style={{ fontSize: "11px", color: "#666", marginLeft: "4px" }}>
                          ({createdByRole})
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <span className="badge bg-secondary">
                        {questionsCount}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div className="form-check form-switch d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`status-${testId}`}
                          checked={status === "enabled"}
                          onChange={() => handleStatusChange(testId, status)}
                        />
                        <label 
                          htmlFor={`status-${testId}`}
                          style={getStatusBadge(status)}
                          className="text-capitalize"
                        >
                          {status}
                        </label>
                      </div>
                    </td>
                    <td className="text-nowrap" style={styles.td}>
                      <Button
                        color="warning"
                        className="me-2"
                        size="sm"
                        onClick={() => handleEdit(testId)}
                        title="Edit Test"
                      >
                        <i className="bi bi-pen-fill"></i>
                      </Button>
                      <Button
                        color="danger"
                        onClick={() => handleDelete(testId)}
                        size="sm"
                        title="Delete Test"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            {searchTerm ? (
              <>
                <i className="bi bi-search" style={{ fontSize: "48px", color: "#ccc" }}></i>
                <h5 style={{ marginTop: "10px", color: "#666" }}>
                  No tests found matching "{searchTerm}"
                </h5>
                <Button color="link" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-text" style={{ fontSize: "48px", color: "#ccc" }}></i>
                <h5 style={{ marginTop: "10px", color: "#666" }}>No tests available</h5>
                <p style={{ color: "#999" }}>
                  Click the "Add Test" button to create your first test.
                </p>
                <button style={styles.addButton} onClick={handleAddTest}>
                  <i className="bi bi-plus-circle"></i> Create Test
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestOverview;