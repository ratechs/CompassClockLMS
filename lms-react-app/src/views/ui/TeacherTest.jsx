import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTests } from "../../hooks/Tests/useTest";
import { useCourse } from "../../hooks/Courses/useCourses";
import { Button } from "reactstrap";
import { useDeleteTests } from "../../hooks/Tests/deleteTest";
import { useTestStatusChange } from "../../hooks/Tests/testStatusChange";
import { useAuthcontext } from "../../contexts/Authcontext";

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addButton: {
    backgroundColor: "#000000",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  th: {
    padding: "12px",
    backgroundColor: "#f4f4f4",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    textTransform: "capitalize",
  },
};

const TestOverview = () => {
  const navigate = useNavigate();
  const { tests, loading } = useTests();
  const { course } = useCourse();
  const { deleteTest } = useDeleteTests();
  const { changeStatus } = useTestStatusChange();
  const { authUser } = useAuthcontext();
  const [currentUserTests, setCurrentUserTests] = useState([]);

  const handleEdit = (id) => {
    navigate(`/teacher/test/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTest(id);
      // Refresh local state after delete
      setCurrentUserTests((prev) => prev.filter((test) => test._id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await changeStatus(id, newStatus);
      setCurrentUserTests((prevTests) =>
        prevTests.map((test) =>
          test._id === id ? { ...test, test_status: newStatus } : test
        )
      );
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  const handleAddTest = () => {
    navigate("/teacher/test/new");
  };

  useEffect(() => {
    if (tests?.data && authUser?.user?._id) {
      const filteredTests = tests.data.filter(
        (t) => t.created_by?._id === authUser.user._id
      );
      setCurrentUserTests(filteredTests);
    }
  }, [tests, authUser]);

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h5>
          <b>Test Overview</b>
        </h5>
        <button style={styles.addButton} onClick={handleAddTest}>
          Add Test
        </button>
      </div>

      <div className="table-responsive">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Test Name</th>
              <th style={styles.th}>Test Type</th>
              <th style={styles.th}>Test Subject</th>
              <th style={styles.th}>Test Lesson</th>
              <th style={styles.th}>Created By</th>
              <th style={styles.th}>Total Questions</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUserTests.length > 0 ? (
              currentUserTests.map((test) => (
                <tr key={test._id}>
                  <td style={styles.td}>{test.test_name}</td>
                  <td style={styles.td}>{test.test_type}</td>
                  <td style={styles.td}>
                    {test.test_subject?.name || "Unknown Subject"}
                  </td>
                  <td style={styles.td}>
                    {test.test_lesson?.name || "Unknown Lesson"}
                  </td>
                  <td style={styles.td}>
                    {test.created_by?.username || "admin"}{" "}
                    {test.created_by?.role ? `(${test.created_by.role})` : ""}
                  </td>
                  <td style={styles.td}>
                    {test.test_questions?.length || "N/A"}
                  </td>
                  <td style={styles.td}>
                    <div className="form-check form-switch">
                      <label htmlFor="statusToggle" className="text-capitalize">
                        {test.test_status}
                      </label>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={test.test_status === "enabled"}
                        onChange={(e) =>
                          handleStatusChange(
                            test._id,
                            e.target.checked ? "enabled" : "disabled"
                          )
                        }
                      />
                    </div>
                  </td>
                  <td className="text-nowrap">
                    <Button
                      color="warning"
                      className="me-2"
                      size="sm"
                      onClick={() => handleEdit(test._id)}
                    >
                      <i className="bi bi-pen-fill"></i>
                    </Button>
                    <Button
                      color="danger"
                      onClick={() => handleDelete(test._id)}
                      size="sm"
                    >
                      <i className="bi bi-trash-fill"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  style={{ textAlign: "left", padding: "20px" }}
                >
                  No tests available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestOverview;
