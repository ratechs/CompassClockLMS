import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuthcontext } from "../../contexts/Authcontext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClock,
  faSearch,
  faUserCheck,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const ApprovalManagement = () => {
  const { authUser } = useAuthcontext();

  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [usernameFilter, setUsernameFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [actionLoading, setActionLoading] = useState(null);

  // =========================================================
  // FETCH COURSES AND JOIN REQUESTS
  // =========================================================

  useEffect(() => {
    const fetchCourses = async () => {
      if (!authUser?.user?._id) {
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get("/api/courses/");
        console.log("Fetched courses:", response.data);

        const courses = response.data.filter(
            (course) =>
              course?.created_by?._id == authUser?.user?._id
            );
        console.log("Fetched filtered courses:", courses);

        const requests = courses.flatMap((course) =>
          (course.joinRequests || []).map((req) => ({
            id: `${course._id}_${req.user?._id || "unknown"}`,
            user: req.user,
            status: req.status,
            course: course.name || course.title,
            courseId: course._id,
          }))
        );

        setAllRequests(requests);
      } catch (error) {
        console.error(
          "Error fetching courses:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Error fetching course requests. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [authUser?.user?._id]);

  // =========================================================
  // FILTER REQUESTS
  // =========================================================

  const filteredRequests = useMemo(() => {
    const usernameQuery =
      usernameFilter.toLowerCase().trim();

    const courseQuery =
      courseFilter.toLowerCase().trim();

    const statusQuery =
      statusFilter.toLowerCase().trim();

    return allRequests.filter((req) => {
      const username =
        req.user?.username?.toLowerCase() || "";

      const fullname =
        req.user?.fullname?.toLowerCase() || "";

      const email =
        req.user?.email?.toLowerCase() || "";

      const course =
        req.course?.toLowerCase() || "";

      const status =
        req.status?.toLowerCase() || "";

      const usernameMatch =
        !usernameQuery ||
        username.includes(usernameQuery) ||
        fullname.includes(usernameQuery) ||
        email.includes(usernameQuery);

      const courseMatch =
        !courseQuery ||
        course.includes(courseQuery);

      const statusMatch =
        !statusQuery ||
        statusQuery === "all" ||
        status === statusQuery;

      return (
        usernameMatch &&
        courseMatch &&
        statusMatch
      );
    });
  }, [
    allRequests,
    usernameFilter,
    courseFilter,
    statusFilter,
  ]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalRequests = allRequests.length;

  const pendingRequests = allRequests.filter(
    (request) =>
      request.status === "pending"
  ).length;

  const approvedRequests = allRequests.filter(
    (request) =>
      request.status === "approved"
  ).length;

  const rejectedRequests = allRequests.filter(
    (request) =>
      request.status === "rejected"
  ).length;

  // =========================================================
  // UPDATE REQUEST
  // =========================================================

  const SendRequest = async (
    courseId,
    userId,
    action
  ) => {
    try {
      if (!courseId || !userId || !action) {
        throw new Error(
          "Missing courseId, userId, or action"
        );
      }

      setActionLoading(
        `${courseId}_${userId}`
      );

      const response = await axios.post(
        "/api/courses/handle-join-request",
        {
          courseId,
          userId,
          action,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "SendRequest error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to process request."
      );

      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // APPROVE
  // =========================================================

  const handleApprove = async (request) => {
    try {
      await SendRequest(
        request.courseId,
        request.user?._id,
        "approved"
      );

      updateRequestStatus(
        request.id,
        "approved"
      );

      toast.success(
        "Course request approved successfully"
      );
    } catch (error) {
      console.error(
        "Error approving request:",
        error
      );
    }
  };

  // =========================================================
  // REJECT
  // =========================================================

  const handleReject = async (request) => {
    try {
      await SendRequest(
        request.courseId,
        request.user?._id,
        "rejected"
      );

      updateRequestStatus(
        request.id,
        "rejected"
      );

      toast.success(
        "Course request rejected"
      );
    } catch (error) {
      console.error(
        "Error rejecting request:",
        error
      );
    }
  };

  // =========================================================
  // UPDATE LOCAL STATUS
  // =========================================================

  const updateRequestStatus = (
    id,
    status
  ) => {
    setAllRequests((prev) =>
      prev.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request
      )
    );
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setUsernameFilter("");
    setCourseFilter("");
    setStatusFilter("");
  };

  const hasFilters =
    usernameFilter ||
    courseFilter ||
    statusFilter;

  // =========================================================
  // STATUS DISPLAY
  // =========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "approved";

      case "rejected":
        return "rejected";

      case "pending":
        return "pending";

      default:
        return "unknown";
    }
  };

  const getStatusText = (status) => {
    if (!status) {
      return "Unknown";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="course-approval-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="course-approval-header">

        <div className="course-approval-title">

          <div className="course-approval-title-icon">
            <FontAwesomeIcon
              icon={faUserCheck}
            />
          </div>

          <div>
            <h2>
              User Course Approvals
            </h2>

            <p>
              Review and manage student
              course join requests
            </p>
          </div>

        </div>

        {/* SEARCH */}

        <div className="course-approval-search">

          <FontAwesomeIcon
            icon={faSearch}
          />

          <input
            type="text"
            placeholder="Search username, name or email..."
            value={usernameFilter}
            onChange={(e) =>
              setUsernameFilter(
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="course-approval-summary">

        {/* TOTAL */}

        <div className="course-summary-card">

          <div className="course-summary-icon total">
            <FontAwesomeIcon
              icon={faUsers}
            />
          </div>

          <div>
            <span>
              Total Requests
            </span>

            <strong>
              {loading
                ? "..."
                : totalRequests}
            </strong>
          </div>

        </div>

        {/* PENDING */}

        <div className="course-summary-card">

          <div className="course-summary-icon pending">
            <FontAwesomeIcon
              icon={faClock}
            />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {loading
                ? "..."
                : pendingRequests}
            </strong>
          </div>

        </div>

        {/* APPROVED */}

        <div className="course-summary-card">

          <div className="course-summary-icon approved">
            <FontAwesomeIcon
              icon={faCheck}
            />
          </div>

          <div>
            <span>
              Approved
            </span>

            <strong>
              {loading
                ? "..."
                : approvedRequests}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN TABLE CARD
      ===================================================== */}

      <div className="course-approval-card">

        {/* CARD HEADER */}

        <div className="course-approval-card-header">

          <div>
            <h3>
              Course Join Requests
            </h3>

            <p>
              {filteredRequests.length} request
              {filteredRequests.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          {/* FILTERS */}

          <div className="course-approval-filters">

            <button
              type="button"
              className={`course-filter-btn ${
                !statusFilter
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter("")
              }
            >
              All
            </button>

            <button
              type="button"
              className={`course-filter-btn pending ${
                statusFilter === "pending"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter("pending")
              }
            >
              Pending
            </button>

            <button
              type="button"
              className={`course-filter-btn approved ${
                statusFilter === "approved"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter("approved")
              }
            >
              Approved
            </button>

            <button
              type="button"
              className={`course-filter-btn rejected ${
                statusFilter === "rejected"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter("rejected")
              }
            >
              Rejected
            </button>

          </div>

        </div>

        {/* =================================================
            ADDITIONAL FILTER ROW
        ================================================= */}

        <div className="course-filter-row">

          <div className="course-filter-field">

            <label>
              Username / Name / Email
            </label>

            <div className="course-filter-input">

              <FontAwesomeIcon
                icon={faSearch}
              />

              <input
                type="text"
                placeholder="Filter users..."
                value={usernameFilter}
                onChange={(e) =>
                  setUsernameFilter(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="course-filter-field">

            <label>
              Course
            </label>

            <input
              type="text"
              className="course-filter-text"
              placeholder="Filter by course..."
              value={courseFilter}
              onChange={(e) =>
                setCourseFilter(
                  e.target.value
                )
              }
            />

          </div>

          {hasFilters && (
            <button
              type="button"
              className="course-clear-filter"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="course-approval-table-wrapper">

          <table className="course-approval-table">

            <thead>

              <tr>
                <th>User</th>
                <th>Course</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (
                <tr>

                  <td
                    colSpan="4"
                    className="course-approval-loading"
                  >

                    <div className="course-approval-loader">

                      <span></span>
                      <span></span>
                      <span></span>

                    </div>

                    Loading course requests...

                  </td>

                </tr>
              ) : filteredRequests.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan="4"
                    className="course-approval-empty"
                  >

                    <div className="course-approval-empty-icon">
                      <FontAwesomeIcon
                        icon={faUserCheck}
                      />
                    </div>

                    <h4>
                      No requests found
                    </h4>

                    <p>
                      No course requests match
                      your current filters.
                    </p>

                  </td>

                </tr>
              ) : (

                /* DATA */

                filteredRequests.map(
                  (request) => {

                    const requestKey =
                      `${request.courseId}_${request.user?._id}`;

                    const isProcessing =
                      actionLoading ===
                      requestKey;

                    return (
                      <tr
                        key={request.id}
                      >

                        {/* USER */}

                        <td>

                          <div className="course-user-info">

                            <div className="course-user-avatar">
                              {(
                                request.user
                                  ?.fullname ||
                                request.user
                                  ?.username ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {request.user
                                  ?.fullname ||
                                  request.user
                                    ?.username ||
                                  "Unknown User"}
                              </strong>

                              <span>
                                @
                                {request.user
                                  ?.username ||
                                  "unknown"}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* COURSE */}

                        <td>

                          <span className="course-name-badge">
                            {request.course ||
                              "Unknown Course"}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`course-status ${getStatusClass(
                              request.status
                            )}`}
                          >

                            <span className="course-status-dot"></span>

                            {getStatusText(
                              request.status
                            )}

                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          {request.status ===
                          "pending" ? (

                            <div className="course-approval-actions">

                              <button
                                type="button"
                                className="course-action-btn approve"
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  handleApprove(
                                    request
                                  )
                                }
                              >

                                <FontAwesomeIcon
                                  icon={faCheck}
                                />

                                <span>
                                  {isProcessing
                                    ? "Processing..."
                                    : "Approve"}
                                </span>

                              </button>

                              <button
                                type="button"
                                className="course-action-btn reject"
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  handleReject(
                                    request
                                  )
                                }
                              >

                                <FontAwesomeIcon
                                  icon={faXmark}
                                />

                                <span>
                                  Reject
                                </span>

                              </button>

                            </div>

                          ) : request.status ===
                            "approved" ? (

                            <span className="course-approved-label">

                              <button
                                type="button"
                                className="course-action-btn reject"
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  handleReject(
                                    request
                                  )
                                }
                              >

                                <span>
                                  Reject
                                </span>

                              </button>

                            </span>

                          ) : request.status ===
                            "rejected" ? (

                            <span className="course-rejected-label">     

                              <button
                                type="button"
                                className="course-action-btn approve"
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  handleApprove(
                                    request
                                  )
                                }
                              >

                                <FontAwesomeIcon
                                  icon={faXmark}
                                />

                                <span>
                                  Approve
                                </span>

                              </button>

                            </span>

                          ) : (

                            <span className="course-no-action">
                              No actions
                            </span>

                          )}

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default ApprovalManagement;