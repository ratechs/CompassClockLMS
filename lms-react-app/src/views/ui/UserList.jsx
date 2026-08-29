import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faEdit,
  faTrash,
  faBan,
  faUnlock,
  faUsers,
  faUserGraduate,
  faChalkboardTeacher,
  faUserShield,
  faUserTie,
  faSearch,
  faRotate,
  faCheck,
  faEye,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthcontext } from "../../contexts/Authcontext";


const UserList = () => {
  // =========================================================
  // STATE
  // =========================================================
  const { authUser } = useAuthcontext();

  const [usersData, setUsersData] = useState([]);

  const [selectedRoleTab, setSelectedRoleTab] = useState("all");

  const [filters, setFilters] = useState({
    username: "",
    email: "",
    role: "",
    isAdmin: "",
    isActive: "",
    isApproved: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);

  // Stores the user ID currently being updated for approval
  const [approvalLoadingId, setApprovalLoadingId] = useState(null);

  // Stores the user ID currently being blocked/unblocked
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  // Stores the user ID currently being deleted
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const usersPerPage = 10;

  // =========================================================
  // ROLE TABS
  // =========================================================

  const roleTabs = [
    {
      key: "all",
      label: "All Users",
      icon: faUsers,
    },
    {
      key: "student",
      label: "Students",
      icon: faUserGraduate,
    },
    {
      key: "teacher",
      label: "Teachers",
      icon: faChalkboardTeacher,
    },
    {
      key: "admin",
      label: "Admins",
      icon: faUserShield,
    },
    {
      key: "coordinator",
      label: "Coordinators",
      icon: faUserTie,
    },
  ];

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/users/");

      setUsersData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching users:", error);

      toast.error(
        error.response?.data?.message ||
          "Error fetching users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // =========================================================
  // BLOCK / UNBLOCK USER
  // =========================================================

  const blockUser = async (user) => {
    const action = user.isActive ? "block" : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.username}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setStatusLoadingId(user._id);

      const updatedStatus = !user.isActive;

      await axios.put(`/api/users/update-userStatus/${user._id}`, {
        isActive: updatedStatus,
      });

      setUsersData((previousUsers) =>
        previousUsers.map((currentUser) =>
          currentUser._id === user._id
            ? {
                ...currentUser,
                isActive: updatedStatus,
              }
            : currentUser
        )
      );

      toast.success(
        `User has been ${
          updatedStatus ? "unblocked" : "blocked"
        } successfully.`
      );
    } catch (error) {
      console.error("Error updating user status:", error);

      toast.error(
        error.response?.data?.message ||
          "Error updating user status. Please try again."
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  // =========================================================
  // APPROVE / UNAPPROVE USER
  // =========================================================

const toggleApproval = async (user) => {
  const updatedApprovalStatus = !user.isApproved;

  try {
    setApprovalLoadingId(user._id);

    const response = await axios.put(
      `/api/users/approve-teacher/${user._id}`,
      {
        status: updatedApprovalStatus,
        approver_id: authUser?.user?._id,
      }
    );

    // Use the returned user from backend when available
    const updatedUser = response.data?.user;

    setUsersData((previousUsers) =>
      previousUsers.map((currentUser) =>
        currentUser._id === user._id
          ? {
              ...currentUser,
              isApproved:
                updatedUser?.isApproved ??
                updatedApprovalStatus,
              approved_by:
                updatedUser?.approved_by ??
                authUser?.user,
            }
          : currentUser
      )
    );

    toast.success(
      updatedApprovalStatus
        ? `${user.username} has been approved successfully.`
        : `${user.username} approval has been removed.`
    );
  } catch (error) {
    console.error(
      "Error updating user approval:",
      error
    );

    toast.error(
      error.response?.data?.message ||
        "Error updating user approval. Please try again."
    );
  } finally {
    setApprovalLoadingId(null);
  }
};

  // =========================================================
  // DELETE USER
  // =========================================================

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.username}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(user._id);

      await axios.delete(`/api/users/destroy/${user._id}`);

      setUsersData((previousUsers) =>
        previousUsers.filter(
          (currentUser) => currentUser._id !== user._id
        )
      );

      toast.success("User has been deleted successfully.");
    } catch (error) {
      console.error("Error deleting user:", error);

      toast.error(
        error.response?.data?.message ||
          "Error deleting user. Please try again."
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // =========================================================
  // FILTER CHANGE
  // =========================================================

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }));

    setCurrentPage(1);
  };

  // =========================================================
  // FILTERED USERS
  // =========================================================

  const filteredUsers = useMemo(() => {
    return [...usersData]
      .reverse()
      .filter((user) => {
        const username =
          user?.username?.toLowerCase() || "";

        const email =
          user?.email?.toLowerCase() || "";

        const role =
          user?.role?.toLowerCase() || "";

        // Username
        const matchesUsername =
          !filters.username ||
          username.includes(
            filters.username.toLowerCase()
          );

        // Email
        const matchesEmail =
          !filters.email ||
          email.includes(
            filters.email.toLowerCase()
          );

        // Role
        const matchesRole =
          !filters.role ||
          role.includes(
            filters.role.toLowerCase()
          );

        // Admin
        const matchesAdmin =
          !filters.isAdmin ||
          (filters.isAdmin === "true" &&
            user.isAdmin === true) ||
          (filters.isAdmin === "false" &&
            user.isAdmin !== true);

        // Active status
        const matchesStatus =
          !filters.isActive ||
          (filters.isActive === "true" &&
            user.isActive === true) ||
          (filters.isActive === "false" &&
            user.isActive !== true);

        // Approval status
        const matchesApproval =
          !filters.isApproved ||
          (filters.isApproved === "true" &&
            user.isApproved === true) ||
          (filters.isApproved === "false" &&
            user.isApproved !== true);

        // Role tab
        let matchesTab = true;

        if (selectedRoleTab !== "all") {
          if (selectedRoleTab === "admin") {
            matchesTab = user.isAdmin === true;
          } else {
            matchesTab = role === selectedRoleTab;
          }
        }

        return (
          matchesUsername &&
          matchesEmail &&
          matchesRole &&
          matchesAdmin &&
          matchesStatus &&
          matchesApproval &&
          matchesTab
        );
      });
  }, [
    usersData,
    filters,
    selectedRoleTab,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const pageCount = Math.ceil(
    filteredUsers.length / usersPerPage
  );

  const paginatedUsers = useMemo(() => {
    const startIndex =
      (currentPage - 1) * usersPerPage;

    return filteredUsers.slice(
      startIndex,
      startIndex + usersPerPage
    );
  }, [filteredUsers, currentPage]);

  // =========================================================
  // ROLE COUNTS
  // =========================================================

  const getRoleCount = (role) => {
    if (role === "all") {
      return usersData.length;
    }

    if (role === "admin") {
      return usersData.filter(
        (user) => user.isAdmin === true
      ).length;
    }

    return usersData.filter(
      (user) =>
        user?.role?.toLowerCase() === role
    ).length;
  };

  // =========================================================
  // EDIT USER
  // =========================================================

  const editUser = (user) => {
    window.location.href =
      `/instructor/users/edit/${user._id}`;
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setFilters({
      username: "",
      email: "",
      role: "",
      isAdmin: "",
      isActive: "",
      isApproved: "",
    });

    setSelectedRoleTab("all");
    setCurrentPage(1);
  };

  // =========================================================
  // ROLE LABEL
  // =========================================================

  const getRoleLabel = (role) => {
    if (!role) {
      return "User";
    }

    return (
      role.charAt(0).toUpperCase() +
      role.slice(1)
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="user-list-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="user-page-header">

        <div className="user-title-wrapper">

          <div className="user-title-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div>
            <h2 className="user-page-title">
              Users
            </h2>

            <p className="user-page-subtitle">
              Manage users, roles, approval and account status
            </p>
          </div>

        </div>

        <button
          type="button"
          className="refresh-users-btn"
          onClick={fetchUserData}
          disabled={loading}
        >
          <FontAwesomeIcon
            icon={faRotate}
            spin={loading}
          />

          <span>
            {loading ? "Refreshing..." : "Refresh"}
          </span>
        </button>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="user-summary">

        {/* Total */}
        <div className="summary-card">

          <div className="summary-icon summary-blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div>
            <span className="summary-label">
              Total Users
            </span>

            <strong className="summary-value">
              {usersData.length}
            </strong>
          </div>

        </div>

        {/* Students */}
        <div className="summary-card">

          <div className="summary-icon summary-green">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>

          <div>
            <span className="summary-label">
              Students
            </span>

            <strong className="summary-value">
              {getRoleCount("student")}
            </strong>
          </div>

        </div>

        {/* Teachers */}
        <div className="summary-card">

          <div className="summary-icon summary-purple">
            <FontAwesomeIcon icon={faChalkboardTeacher} />
          </div>

          <div>
            <span className="summary-label">
              Teachers
            </span>

            <strong className="summary-value">
              {getRoleCount("teacher")}
            </strong>
          </div>

        </div>

        {/* Admins */}
        <div className="summary-card">

          <div className="summary-icon summary-orange">
            <FontAwesomeIcon icon={faUserShield} />
          </div>

          <div>
            <span className="summary-label">
              Administrators
            </span>

            <strong className="summary-value">
              {getRoleCount("admin")}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <div className="users-main-card">

        {/* ===================================================
            ROLE TABS
        ==================================================== */}

        <div className="role-tabs-wrapper">

          <div className="role-tabs">

            {roleTabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                className={`role-tab ${
                  selectedRoleTab === tab.key
                    ? "role-tab-active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedRoleTab(tab.key);
                  setCurrentPage(1);
                }}
              >

                <FontAwesomeIcon
                  icon={tab.icon}
                  className="role-tab-icon"
                />

                <span>
                  {tab.label}
                </span>

                <span className="role-tab-count">
                  {getRoleCount(tab.key)}
                </span>

              </button>
            ))}

          </div>

        </div>

        {/* ===================================================
            FILTER AREA
        ==================================================== */}

        <div className="users-filter-area">

          <div className="filter-heading">

            <div className="filter-title">
              <FontAwesomeIcon icon={faSearch} />
              <span>Filters</span>
            </div>

            <button
              type="button"
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>

          <div className="filter-grid">

            {/* Username */}
            <div className="filter-field">

              <label>
                Username
              </label>

              <input
                type="text"
                name="username"
                value={filters.username}
                onChange={handleFilterChange}
                placeholder="Search username..."
              />

            </div>

            {/* Email */}
            <div className="filter-field">

              <label>
                Email
              </label>

              <input
                type="text"
                name="email"
                value={filters.email}
                onChange={handleFilterChange}
                placeholder="Search email..."
              />

            </div>

            {/* Role */}
            <div className="filter-field">

              <label>
                Role
              </label>

              <input
                type="text"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                placeholder="Search role..."
              />

            </div>

            {/* Admin */}
            <div className="filter-field">

              <label>
                Admin
              </label>

              <select
                name="isAdmin"
                value={filters.isAdmin}
                onChange={handleFilterChange}
              >
                <option value="">
                  All
                </option>

                <option value="true">
                  Admin
                </option>

                <option value="false">
                  User
                </option>
              </select>

            </div>

            {/* Status */}
            <div className="filter-field">

              <label>
                Status
              </label>

              <select
                name="isActive"
                value={filters.isActive}
                onChange={handleFilterChange}
              >
                <option value="">
                  All
                </option>

                <option value="true">
                  Active
                </option>

                <option value="false">
                  Blocked
                </option>
              </select>

            </div>

            {/* Approval */}
            <div className="filter-field">

              <label>
                Approval
              </label>

              <select
                name="isApproved"
                value={filters.isApproved}
                onChange={handleFilterChange}
              >
                <option value="">
                  All
                </option>

                <option value="true">
                  Approved
                </option>

                <option value="false">
                  Pending
                </option>
              </select>

            </div>

          </div>

        </div>

        {/* ===================================================
            TABLE
        ==================================================== */}

        <div className="user-table-wrapper">

          <table className="user-table table-responsive">

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Admin
                </th>

                <th>
                  Status
                </th>

                <th>
                  Approval
                </th>

                <th>
                  Registered
                </th>

                <th className="actions-header">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {/* =================================================
                  LOADING
              ================================================== */}

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="table-message"
                  >

                    <div className="loading-state">

                      <div className="loading-spinner"></div>

                      <span>
                        Loading users...
                      </span>

                    </div>

                  </td>

                </tr>

              ) : paginatedUsers.length > 0 ? (

                /* =================================================
                    USERS
                ================================================== */

                paginatedUsers.map((user) => (

                  <tr key={user._id}>

                    {/* USER */}
                    <td>

                      <div className="user-info">

                        <div className="user-avatar">

                          {user.profilePicture ? (

                            <img
                              src={user.profilePicture}
                              alt={
                                user.username ||
                                "User"
                              }
                            />

                          ) : (

                            user.username
                              ?.charAt(0)
                              ?.toUpperCase() || "U"

                          )}

                        </div>

                        <div className="user-name-wrapper">

                          <strong>
                            {user.username || "-"}
                          </strong>

                          {user.fullname && (
                            <small>
                              {user.fullname}
                            </small>
                          )}

                        </div>

                      </div>

                    </td>

                    {/* EMAIL */}
                    <td>

                      <span className="email-text">
                        {user.email || "-"}
                      </span>

                    </td>

                    {/* ROLE */}
                    <td>

                      <span
                        className={`role-badge role-${
                          user.role || "user"
                        }`}
                      >
                        {getRoleLabel(user.role)}
                      </span>

                    </td>

                    {/* ADMIN */}
                    <td>

                      {user.isAdmin ? (

                        <span className="admin-badge">

                          <span className="status-dot"></span>

                          Admin

                        </span>

                      ) : (

                        <span className="user-badge">
                          User
                        </span>

                      )}

                    </td>

                    {/* STATUS */}
                    <td>

                      <span
                        className={`status-badge ${
                          user.isActive
                            ? "status-active"
                            : "status-blocked"
                        }`}
                      >

                        <span className="status-dot"></span>

                        {user.isActive
                          ? "Active"
                          : "Blocked"}

                      </span>

                    </td>

                    {/* APPROVAL */}
                    <td>

                      <div className="approval-control">

                        <button
                          type="button"
                          className={`approval-toggle ${
                            user.isApproved
                              ? "approved"
                              : "pending"
                          }`}
                          onClick={() =>
                            toggleApproval(user)
                          }
                          disabled={
                            approvalLoadingId ===
                            user._id
                          }
                          title={
                            user.isApproved
                              ? "Remove approval"
                              : "Approve user"
                          }
                          aria-label={
                            user.isApproved
                              ? `Remove approval for ${
                                  user.username
                                }`
                              : `Approve ${
                                  user.username
                                }`
                          }
                        >

                          <span className="approval-toggle-track">

                            <span className="approval-toggle-thumb">

                              {approvalLoadingId ===
                              user._id ? (

                                <span className="toggle-spinner"></span>

                              ) : user.isApproved ? (

                                <FontAwesomeIcon
                                  icon={faCheck}
                                />

                              ) : null}

                            </span>

                          </span>

                        </button>

                        <span
                          className={`approval-label ${
                            user.isApproved
                              ? "approved-label"
                              : "pending-label"
                          }`}
                        >

                          {user.isApproved ? (
                            <>
                              <FontAwesomeIcon
                                icon={faCheck}
                              />
                              Approved
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon
                                icon={faClock}
                              />
                              Pending
                            </>
                          )}

                        </span>

                      </div>

                    </td>

                    {/* REGISTERED */}
                    <td>

                      <span className="registered-date">

                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}

                      </span>

                    </td>

                    {/* ACTIONS */}
                    <td>

                      <div className="user-actions">

                        {/* EDIT */}
                        <button
                          type="button"
                          className="user-action view-action"
                          onClick={() =>
                            window.location.href = `/instructor/users/view/${user._id}`
                          }
                          title="View User"
                          aria-label={`View ${user.username}`}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          type="button"
                          className="user-action edit-action"
                          onClick={() =>
                            editUser(user)
                          }
                          title="Edit User"
                        >
                          <FontAwesomeIcon
                            icon={faEdit}
                          />
                        </button>

                        {/* BLOCK / UNBLOCK */}
                        <button
                          type="button"
                          className={`user-action ${
                            user.isActive
                              ? "block-action"
                              : "unblock-action"
                          }`}
                          onClick={() =>
                            blockUser(user)
                          }
                          disabled={
                            statusLoadingId ===
                            user._id
                          }
                          title={
                            user.isActive
                              ? "Block User"
                              : "Unblock User"
                          }
                        >

                          {statusLoadingId ===
                          user._id ? (

                            <span className="button-spinner"></span>

                          ) : (

                            <FontAwesomeIcon
                              icon={
                                user.isActive
                                  ? faBan
                                  : faUnlock
                              }
                            />

                          )}

                        </button>

                        {/* DELETE */}
                        {/* <button
                          type="button"
                          className="user-action delete-action"
                          onClick={() =>
                            deleteUser(user)
                          }
                          disabled={
                            deleteLoadingId ===
                            user._id
                          }
                          title="Delete User"
                        >

                          {deleteLoadingId ===
                          user._id ? (

                            <span className="button-spinner"></span>

                          ) : (

                            <FontAwesomeIcon
                              icon={faTrash}
                            />

                          )}

                        </button> */}

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                /* =================================================
                    EMPTY STATE
                ================================================== */

                <tr>

                  <td
                    colSpan="8"
                    className="table-message"
                  >

                    <div className="empty-state">

                      <div className="empty-icon">

                        <FontAwesomeIcon
                          icon={faUsers}
                        />

                      </div>

                      <h5>
                        No users found
                      </h5>

                      <p>
                        No users match your current
                        filters.
                      </p>

                      <button
                        type="button"
                        onClick={clearFilters}
                        className="empty-clear-btn"
                      >
                        Clear Filters
                      </button>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {!loading &&
          filteredUsers.length > 0 && (

            <div className="users-pagination">

              <div className="pagination-results">

                Showing{" "}

                <strong>
                  {(currentPage - 1) *
                    usersPerPage +
                    1}
                </strong>

                {" "}-

                <strong>
                  {Math.min(
                    currentPage *
                      usersPerPage,
                    filteredUsers.length
                  )}
                </strong>

                {" "}of{" "}

                <strong>
                  {filteredUsers.length}
                </strong>

                {" "}users

              </div>

              {pageCount > 1 && (

                <div className="pagination-controls">

                  <button
                    type="button"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (previousPage) =>
                          previousPage - 1
                      )
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage} of{" "}
                    {pageCount}
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      pageCount
                    }
                    onClick={() =>
                      setCurrentPage(
                        (previousPage) =>
                          previousPage + 1
                      )
                    }
                  >
                    Next
                  </button>

                </div>

              )}

            </div>

          )}

      </div>
    </div>
  );
};

export default UserList;