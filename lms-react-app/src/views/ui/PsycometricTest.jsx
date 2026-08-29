// views/ui/PsychometricTestList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "reactstrap";
import { useAdminGetAllPsychometricTests, useAdminDeletePsychometricTest } from "../../hooks/PsychometricTest/psuchometricTest";
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
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    minWidth: "700px",
    fontSize: "14px",
  },
  th: {
    padding: "14px 12px",
    backgroundColor: "#f8f9fa",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontWeight: "600",
    color: "#2d3436",
    borderBottom: "2px solid #e9ecef",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #f1f3f5",
    verticalAlign: "middle",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  activeBadge: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  inactiveBadge: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
    fontSize: "18px",
    color: "#666",
  },
  statsCard: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  statItem: {
    background: "#fff",
    padding: "14px 24px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    flex: "1 1 auto",
    minWidth: "120px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2d3436",
  },
  statLabel: {
    fontSize: "12px",
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
};

const PsychometricTestList = () => {
  const navigate = useNavigate();
  
  // ✅ FIX 1: Destructure correctly
  const { getAllTests, loading } = useAdminGetAllPsychometricTests();
  const { deleteTest } = useAdminDeletePsychometricTest();
  
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTests, setFilteredTests] = useState([]);

  // ✅ FIX 2: Fetch tests on mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const result = await getAllTests();
        if (result?.success) {
          setTests(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching tests:", error);
        toast.error("Failed to load tests");
      }
    };
    fetchTests();
  }, []); // ✅ Empty dependency - runs once on mount

  // ✅ FIX 3: Filter tests when tests or searchTerm changes
  useEffect(() => {
    if (tests.length > 0) {
      const filtered = tests.filter((test) => {
        const search = searchTerm.toLowerCase();
        const title = (test?.test_title || test?.title || "").toLowerCase();
        const version = (test?.test_version || test?.version || "").toLowerCase();
        const language = (test?.language || "").toLowerCase();
        return title.includes(search) || version.includes(search) || language.includes(search);
      });
      setFilteredTests(filtered);
    } else {
      setFilteredTests([]);
    }
  }, [tests, searchTerm]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleEdit = (id) => {
    if (id) navigate(`/instructor/psychometric-test/${id}`);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      try {
        await deleteTest(id);
        toast.success("Test deleted successfully");
        // ✅ Refresh list after delete
        const result = await getAllTests();
        if (result?.success) {
          setTests(result.data || []);
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete test");
      }
    }
  };

  const handleAddTest = () => {
    navigate("/instructor/psychometric-test/new");
  };

  const handleViewDetails = (id) => {
    if (id) navigate(`/instructor/psychometric-test/${id}`);
  };

  // ================================================================
  // HELPER FUNCTIONS
  // ================================================================

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return { ...styles.statusBadge, ...styles.activeBadge };
    }
    return { ...styles.statusBadge, ...styles.inactiveBadge };
  };

  const getSectionCount = (sections) => {
    if (!sections) return 0;
    return Object.keys(sections).length;
  };

  const getTotalQuestions = (sections) => {
    if (!sections) return 0;
    let count = 0;
    Object.values(sections).forEach((section) => {
      if (section.questions) {
        count += section.questions.length;
      }
    });
    return count;
  };

  // ================================================================
  // STATISTICS
  // ================================================================

  const stats = {
    total: tests.length,
    active: tests.filter((t) => t.is_active).length,
    inactive: tests.filter((t) => !t.is_active).length,
  };

  // ================================================================
  // LOADING
  // ================================================================

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

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div style={styles.container}>
      {/* ====== HEADER ====== */}
      <div style={styles.headerContainer}>
        <div>
          <h5 style={{ marginBottom: "4px" }}>
            <b>🧠 Psychometric Tests</b>
            <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666", marginLeft: "10px" }}>
              ({filteredTests.length} tests)
            </span>
          </h5>
          <p style={{ fontSize: "13px", color: "#6c757d", margin: 0 }}>
            Holistic Student Assessment (S1-S5) - Test Templates
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <input
            type="text"
            placeholder="Search tests..."
            className="form-control"
            style={{ maxWidth: "200px", borderRadius: "8px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button style={styles.addButton} onClick={handleAddTest}>
            <i className="bi bi-plus-circle"></i> New Test
          </button>
        </div>
      </div>

      {/* ====== STATISTICS ====== */}
      <div style={styles.statsCard}>
        <div style={styles.statItem}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Tests</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statValue}>{stats.active}</div>
          <div style={styles.statLabel}>Active</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statValue}>{stats.inactive}</div>
          <div style={styles.statLabel}>Inactive</div>
        </div>
      </div>

      {/* ====== TABLE ====== */}
      <div style={styles.tableWrapper}>
        {filteredTests.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Test Name</th>
                <th style={styles.th}>Version</th>
                <th style={styles.th}>Language</th>
                <th style={styles.th}>Sections</th>
                <th style={styles.th}>Questions</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test, index) => {
                const sectionCount = getSectionCount(test.sections);
                const totalQuestions = getTotalQuestions(test.sections);
                // ✅ FIX: Use test_title or title
                const testName = test?.test_title || test?.title || "Untitled";
                const testVersion = test.test_version || test.version || "1.0";
                const createdAt = test.createdAt || test.created_at;

                return (
                  <tr key={test._id || index}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{testName}</strong>
                      {test.description && (
                        <div style={{ fontSize: "11px", color: "#6c757d" }}>
                          {test.description.length > 50 
                            ? `${test.description.substring(0, 50)}...` 
                            : test.description}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span className="badge bg-secondary">v{testVersion}</span>
                    </td>
                    <td style={styles.td}>
                      <span className="badge bg-light text-dark">
                        {test.language || "en"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span className="badge bg-primary">
                        {sectionCount} (S1-S5)
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span className="badge bg-info text-white">
                        {totalQuestions}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusBadge(test.is_active)}>
                        {test.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>
                        {createdAt 
                          ? new Date(createdAt).toLocaleDateString() 
                          : "-"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div className="d-flex gap-1 flex-wrap">
                        <Button
                          color="info"
                          size="sm"
                          onClick={() => handleViewDetails(test._id)}
                          title="View Details"
                          style={{ padding: "4px 10px" }}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </Button>
                        <Button
                          color="warning"
                          size="sm"
                          onClick={() => handleEdit(test._id)}
                          title="Edit Test"
                          style={{ padding: "4px 10px" }}
                        >
                          <i className="bi bi-pen-fill"></i>
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          onClick={() => handleDelete(test._id)}
                          title="Delete Test"
                          style={{ padding: "4px 10px" }}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </div>
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
                <h5 style={{ marginTop: "10px", color: "#666" }}>No psychometric tests available</h5>
                <p style={{ color: "#999" }}>
                  Click the "New Test" button to create your first assessment.
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

export default PsychometricTestList;