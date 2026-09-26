import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuthcontext } from "../../contexts/Authcontext";
import {
  faCheck,
  faClock,
  faSearch,
  faUserCheck,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TeacherApprovals = () => {
  const { authUser } = useAuthcontext();

  const [approvalList, setApprovalList] = useState([]);
  const [institution, setInstitution] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // =========================================================
  // FETCH INSTITUTIONS
  // =========================================================
  useEffect(() => {
    const fetchInstitutions = async () => {
      if (!authUser?.user?._id) {
        return;
      }

      try {
        const url =
          authUser?.user?.role === "coordinator"
            ? `/api/institutions/managment/${authUser.user._id}/`
            : `/api/institutions/`;

        const res = await axios.get(url);

        setInstitution(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching institutions:", err);

        toast.error(
          err.response?.data?.message ||
            "Error loading institutions"
        );
      }
    };

    fetchInstitutions();
  }, [authUser?.user?._id, authUser?.user?.role]);

  // =========================================================
  // FETCH USERS FROM INSTITUTIONS
  // =========================================================
  useEffect(() => {
    const fetchApprovalsForInstitutions = async () => {
      if (!institution || institution.length === 0) {
        setApprovalList([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const approvalPromises = institution.map(async (item) => {
          try {
            const res = await axios.get(
              `/api/users/institution/${item?._id}`
            );

            const users = Array.isArray(res.data)
              ? res.data
              : [];

            return users.map((user) => ({
              ...user,
              institutionName:
                item?.name || "Unknown Institution",
            }));
          } catch (error) {
            console.error(
              `Error fetching users for institution ${item?._id}:`,
              error
            );

            return [];
          }
        });

        const results = await Promise.all(approvalPromises);

        const allUsers = results.flat();

        // Only teachers
        const teachers = allUsers.filter(
          (user) =>
            user.role === "teacher" ||
            user.role === "instructor"
        );

        setApprovalList(teachers);
      } catch (err) {
        console.error(
          "Error fetching teacher approvals:",
          err
        );

        toast.error(
          err.response?.data?.message ||
            "Error fetching teacher approvals"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalsForInstitutions();
  }, [institution]);

  // =========================================================
  // SEARCH + STATUS FILTER
  // =========================================================
  const filteredList = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return approvalList.filter((req) => {
      const matchesSearch =
        !query ||
        req.username
          ?.toLowerCase()
          .includes(query) ||
        req.fullname
          ?.toLowerCase()
          .includes(query) ||
        req.email
          ?.toLowerCase()
          .includes(query) ||
        req.phoneNumber
          ?.toString()
          .toLowerCase()
          .includes(query) ||
        req.institutionName
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "approved" &&
          req.isApproved === true) ||
        (filterStatus === "pending" &&
          !req.isApproved);

      return matchesSearch && matchesStatus;
    });
  }, [
    approvalList,
    searchQuery,
    filterStatus,
  ]);

  // =========================================================
  // COUNTS
  // =========================================================
  const totalTeachers = approvalList.length;

  const approvedTeachers = approvalList.filter(
    (user) => user.isApproved === true
  ).length;

  const pendingTeachers = approvalList.filter(
    (user) => !user.isApproved
  ).length;

  // =========================================================
  // APPROVE / REJECT
  // =========================================================
  const SendRequest = async (
    approveID,
    userId,
    status
  ) => {
    try {
      setActionLoading(userId);

      const response = await axios.put(
        `/api/users/approve-teacher/${userId}`,
        {
          approver_id: approveID,
          status,
        }
      );

      setApprovalList((prev) =>
        prev.map((user) =>
          user._id === userId
            ? {
                ...user,
                isApproved: status,
                approved_by: status
                  ? authUser?.user
                  : null,
              }
            : user
        )
      );

      toast.success(
        status
          ? "Teacher approved successfully"
          : "Teacher rejected successfully"
      );

      return response.data;
    } catch (error) {
      console.error(
        "Teacher approval error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update teacher approval."
      );

      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (user) => {
    try {
      await SendRequest(
        authUser?.user?._id,
        user._id,
        true
      );
    } catch (err) {
      // Error already handled in SendRequest
    }
  };

  const handleReject = async (user) => {
    try {
      await SendRequest(
        authUser?.user?._id,
        user._id,
        false
      );
    } catch (err) {
      // Error already handled in SendRequest
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================
  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="teacher-approval-page">

      {/* HEADER */}
      <div className="teacher-approval-header">
        <div className="teacher-approval-title">
          <div className="teacher-approval-title-icon">
            <FontAwesomeIcon icon={faUserCheck} />
          </div>

          <div>
            <h2>Teacher Approval</h2>
            <p>
              Review and manage teacher registration
              requests
            </p>
          </div>
        </div>

        <div className="teacher-approval-search">
          <FontAwesomeIcon icon={faSearch} />

          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="teacher-approval-summary">

        <div className="teacher-approval-summary-card">
          <div className="summary-icon total">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div>
            <span>Total Teachers</span>
            <strong>
              {loading ? "..." : totalTeachers}
            </strong>
          </div>
        </div>

        <div className="teacher-approval-summary-card">
          <div className="summary-icon approved">
            <FontAwesomeIcon icon={faCheck} />
          </div>

          <div>
            <span>Approved</span>
            <strong>
              {loading ? "..." : approvedTeachers}
            </strong>
          </div>
        </div>

        <div className="teacher-approval-summary-card">
          <div className="summary-icon pending">
            <FontAwesomeIcon icon={faClock} />
          </div>

          <div>
            <span>Pending</span>
            <strong>
              {loading ? "..." : pendingTeachers}
            </strong>
          </div>
        </div>

      </div>

      {/* TABLE CARD */}
      <div className="teacher-approval-card">

        {/* FILTER */}
        <div className="teacher-approval-card-header">

          <div>
            <h3>Teacher Requests</h3>

            <p>
              {filteredList.length} teacher
              {filteredList.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <div className="teacher-approval-filters">

            <button
              type="button"
              className={
                filterStatus === "all"
                  ? "approval-filter active"
                  : "approval-filter"
              }
              onClick={() =>
                setFilterStatus("all")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                filterStatus === "pending"
                  ? "approval-filter pending active"
                  : "approval-filter pending"
              }
              onClick={() =>
                setFilterStatus("pending")
              }
            >
              Pending
            </button>

            <button
              type="button"
              className={
                filterStatus === "approved"
                  ? "approval-filter approved active"
                  : "approval-filter approved"
              }
              onClick={() =>
                setFilterStatus("approved")
              }
            >
              Approved
            </button>

          </div>
        </div>

        {/* TABLE */}
        <div className="teacher-approval-table-wrapper">

          <table className="teacher-approval-table">

            <thead>
              <tr>
                <th>Teacher</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Institution</th>
                <th>Registered</th>
                <th>Active</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="teacher-approval-loading"
                  >
                    <div className="approval-loader">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    Loading teacher requests...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="teacher-approval-empty"
                  >
                    <FontAwesomeIcon
                      icon={faUserCheck}
                    />

                    <h4>
                      No teacher requests found
                    </h4>

                    <p>
                      No teachers match your current
                      search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((req) => (
                  <tr key={req._id}>

                    {/* TEACHER */}
                    <td>
                      <div className="approval-teacher-info">

                        <div className="approval-avatar">
                          {(
                            req.fullname ||
                            req.username ||
                            "T"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {req.fullname ||
                              req.username ||
                              "Unknown"}
                          </strong>

                          <span>
                            @{req.username ||
                              "unknown"}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* EMAIL */}
                    <td>
                      {req.email || "N/A"}
                    </td>

                    {/* PHONE */}
                    <td>
                      {req.phoneNumber || "N/A"}
                    </td>

                    {/* INSTITUTION */}
                    <td>
                      <span className="institution-badge">
                        {req.institutionName ||
                          "Unknown"}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="text-nowrap">
                      {formatDate(req.createdAt)}
                    </td>

                    {/* ACTIVE */}
                    <td>
                      <span
                        className={
                          req.isActive
                            ? "approval-status active"
                            : "approval-status inactive"
                        }
                      >
                        <span></span>
                        {req.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    {/* APPROVAL */}
                    <td>
                      <span
                        className={
                          req.isApproved
                            ? "approval-status approved"
                            : "approval-status pending"
                        }
                      >
                        <span></span>
                        {req.isApproved
                          ? "Approved"
                          : "Pending"}
                      </span>
                    </td>

                    {/* APPROVED BY */}
                    <td>
                      {req?.approved_by ? (
                        <div className="approved-by">

                          <strong>
                            {req.approved_by
                              ?.username ||
                              req.approved_by
                              ?.fullname ||
                              "Approved"}
                          </strong>

                          <span>
                            {req.approved_by
                              ?.isAdmin
                              ? "Admin"
                              : req.approved_by
                                  ?.role ||
                                "User"}
                          </span>

                        </div>
                      ) : (
                        <span className="not-approved">
                          Not yet approved
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td>
                      {!req.isApproved ? (
                        <div className="approval-actions">

                          <button
                            type="button"
                            className="approval-action approve"
                            disabled={
                              actionLoading ===
                              req._id
                            }
                            onClick={() =>
                              handleApprove(req)
                            }
                            title="Approve teacher"
                          >
                            <FontAwesomeIcon
                              icon={faCheck}
                            />

                            <span>
                              {actionLoading ===
                              req._id
                                ? "..."
                                : "Approve"}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="approval-action reject"
                            disabled={
                              actionLoading ===
                              req._id
                            }
                            onClick={() =>
                              handleReject(req)
                            }
                            title="Reject teacher"
                          >
                            <FontAwesomeIcon
                              icon={faXmark}
                            />

                            <span>Reject</span>
                          </button>

                        </div>
                      ) : (
                        <span className="approved-label">
                          <FontAwesomeIcon
                            icon={faCheck}
                          />
                          Approved
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
};

export default TeacherApprovals;