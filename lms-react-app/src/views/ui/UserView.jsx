import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowLeft,
  faEdit,
  faUser,
  faEnvelope,
  faPhone,
  faGraduationCap,
  faBookOpen,
  faUsers,
  faShieldHalved,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faCalendarDays,
  faUserTie,
  faBriefcase,
  faLayerGroup,
  faIdBadge,
} from "@fortawesome/free-solid-svg-icons";

import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Badge,
  Spinner,
} from "reactstrap";


const UserView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // FETCH USER
  // =========================================================

  const fetchUser = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/api/users/${id}`
      );

      setUser(response.data?.user || response.data);
    } catch (error) {
      console.error("Error fetching user:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load user details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "Never";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getInitials = () => {
    if (user?.fullname) {
      return user.fullname
        .split(" ")
        .slice(0, 2)
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase();
    }

    if (user?.username) {
      return user.username
        .charAt(0)
        .toUpperCase();
    }

    return "U";
  };

  const getRoleClass = (role) => {
    switch (role?.toLowerCase()) {
      case "student":
        return "user-view-role-student";

      case "teacher":
        return "user-view-role-teacher";

      case "admin":
        return "user-view-role-admin";

      case "coordinator":
        return "user-view-role-coordinator";

      default:
        return "user-view-role-default";
    }
  };

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
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="user-view-loading">
        <div className="user-view-loading-spinner">
          <Spinner color="primary" />
        </div>

        <h6>Loading user profile...</h6>

        <p>
          Please wait while we fetch the user
          information.
        </p>
      </div>
    );
  }

  // =========================================================
  // USER NOT FOUND
  // =========================================================

  if (!user) {
    return (
      <Container className="user-view-page">
        <Card className="user-view-empty-card">
          <CardBody className="text-center">
            <div className="user-view-empty-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>

            <h4>User not found</h4>

            <p>
              The requested user profile could not
              be found.
            </p>

            <Button
              color="primary"
              onClick={() => navigate(-1)}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="me-2"
              />
              Go Back
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="user-view-page">

      <Container fluid>

        {/* =====================================================
            TOP BAR
        ====================================================== */}

        <div className="user-view-topbar">

          <Button
            color="link"
            className="user-view-back-btn"
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
            />

            <span>Back to Users</span>
          </Button>

          <Button
            color="primary"
            className="user-view-edit-btn btn-gradient"
            onClick={() =>
              navigate(
                `/instructor/users/edit/${user._id}`
              )
            }
          >
            <FontAwesomeIcon
              icon={faEdit}
              className="me-2"
            />

            Edit User
          </Button>

        </div>

        {/* =====================================================
            PROFILE HEADER
        ====================================================== */}

        <Card className="user-view-profile-card">

          <CardBody>

            <Row className="align-items-center">

              <Col
                lg="8"
                md="7"
                xs="12"
              >

                <div className="user-view-profile">

                  <div className="user-view-avatar">

                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={
                          user.fullname ||
                          user.username
                        }
                      />
                    ) : (
                      <span>
                        {getInitials()}
                      </span>
                    )}

                    <span
                      className={`user-view-online-dot ${
                        user.isActive
                          ? "active"
                          : "inactive"
                      }`}
                    />

                  </div>

                  <div className="user-view-profile-info">

                    <div className="user-view-name-row">

                      <h2>
                        {user.fullname ||
                          user.username ||
                          "Unnamed User"}
                      </h2>

                      {user.isApproved && (
                        <span className="user-view-verified">
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                          />
                        </span>
                      )}

                    </div>

                    <p className="user-view-username">
                      @{user.username}
                    </p>

                    <div className="user-view-badges">

                      <span
                        className={`user-view-role-badge ${getRoleClass(
                          user.role
                        )}`}
                      >
                        <FontAwesomeIcon
                          icon={faUserTie}
                        />

                        {getRoleLabel(
                          user.role
                        )}
                      </span>

                      <span
                        className={`user-view-status-badge ${
                          user.isActive
                            ? "active"
                            : "blocked"
                        }`}
                      >
                        <span className="user-view-status-dot" />

                        {user.isActive
                          ? "Active"
                          : "Blocked"}
                      </span>

                      <span
                        className={`user-view-approval-badge ${
                          user.isApproved
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={
                            user.isApproved
                              ? faCircleCheck
                              : faClock
                          }
                        />

                        {user.isApproved
                          ? "Approved"
                          : "Pending Approval"}
                      </span>

                    </div>

                  </div>

                </div>

              </Col>

              <Col
                lg="4"
                md="5"
                xs="12"
              >

                <div className="user-view-account-summary">

                  <div className="user-view-summary-item">

                    <span className="summary-item-icon">
                      <FontAwesomeIcon
                        icon={faCalendarDays}
                      />
                    </span>

                    <div>
                      <small>
                        Registered
                      </small>

                      <strong>
                        {formatDate(
                          user.createdAt
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="user-view-summary-item">

                    <span className="summary-item-icon">
                      <FontAwesomeIcon
                        icon={faBookOpen}
                      />
                    </span>

                    <div>
                      <small>
                        Courses
                      </small>

                      <strong>
                        {user.courses?.length ||
                          0}
                      </strong>
                    </div>

                  </div>

                </div>

              </Col>

            </Row>

          </CardBody>

        </Card>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <Row className="user-view-content">

          {/* ===================================================
              LEFT
          ==================================================== */}

          <Col
            lg="8"
            xl="8"
          >

            {/* CONTACT INFORMATION */}

            <Card className="user-view-card">

              <CardBody>

                <div className="user-view-card-header">

                  <div className="user-view-section-icon blue">
                    <FontAwesomeIcon
                      icon={faUser}
                    />
                  </div>

                  <div>
                    <h5>
                      Personal Information
                    </h5>

                    <p>
                      Basic information about this
                      user
                    </p>
                  </div>

                </div>

                <Row>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faUser}
                      label="Full Name"
                      value={
                        user.fullname ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faIdBadge}
                      label="Username"
                      value={
                        user.username ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faEnvelope}
                      label="Email Address"
                      value={
                        user.email ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faPhone}
                      label="Phone Number"
                      value={
                        user.phoneNumber ||
                        "Not provided"
                      }
                    />

                  </Col>

                </Row>

              </CardBody>

            </Card>

            {/* EDUCATION */}

            <Card className="user-view-card">

              <CardBody>

                <div className="user-view-card-header">

                  <div className="user-view-section-icon purple">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                    />
                  </div>

                  <div>
                    <h5>
                      Education & Expertise
                    </h5>

                    <p>
                      Academic and professional
                      information
                    </p>
                  </div>

                </div>

                <Row>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faGraduationCap}
                      label="Education Level"
                      value={
                        user.educationLevel ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faBookOpen}
                      label="School Class"
                      value={
                        user.schoolClass ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faGraduationCap}
                      label="College Degree"
                      value={
                        user.collegeDegree ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faGraduationCap}
                      label="Custom Degree"
                      value={
                        user.customCollegeDegree ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faBriefcase}
                      label="Experience"
                      value={
                        user.experience ||
                        "Not provided"
                      }
                    />

                  </Col>

                  <Col
                    md="6"
                    className="mb-4"
                  >

                    <InfoItem
                      icon={faUserTie}
                      label="Expertise"
                      value={
                        user.expertise ||
                        "Not provided"
                      }
                    />

                  </Col>

                </Row>

              </CardBody>

            </Card>

            {/* COURSES */}

            <Card className="user-view-card">

              <CardBody>

                <div className="user-view-card-header">

                  <div className="user-view-section-icon green">
                    <FontAwesomeIcon
                      icon={faBookOpen}
                    />
                  </div>

                  <div>
                    <h5>
                      Enrolled Courses
                    </h5>

                    <p>
                      Courses associated with this
                      account
                    </p>
                  </div>

                </div>

                {user.courses?.length > 0 ? (

                  <div className="user-view-course-list">

                    {user.courses.map(
                      (course, index) => (
                        <div
                          className="user-view-course-item"
                          key={
                            course?._id ||
                            course ||
                            index
                          }
                        >

                          <div className="course-number">
                            {index + 1}
                          </div>

                          <div className="course-info">
                            <strong>
                              {course?.name ||
                                course?.title ||
                                course?._id ||
                                course}
                            </strong>

                            <small>
                              Course enrollment
                            </small>
                          </div>

                        </div>
                      )
                    )}

                  </div>

                ) : (

                  <div className="user-view-no-data">

                    <FontAwesomeIcon
                      icon={faBookOpen}
                    />

                    <span>
                      No courses enrolled
                    </span>

                  </div>

                )}

              </CardBody>

            </Card>

          </Col>

          {/* ===================================================
              RIGHT SIDEBAR
          ==================================================== */}

          <Col
            lg="4"
            xl="4"
          >

            {/* ACCOUNT STATUS */}

            <Card className="user-view-card">

              <CardBody>

                <div className="user-view-card-header">

                  <div className="user-view-section-icon orange">
                    <FontAwesomeIcon
                      icon={faShieldHalved}
                    />
                  </div>

                  <div>
                    <h5>
                      Account Status
                    </h5>

                    <p>
                      Current account permissions
                    </p>
                  </div>

                </div>

                <div className="user-view-status-list">

                  <StatusItem
                    label="Account"
                    value={
                      user.isActive
                        ? "Active"
                        : "Blocked"
                    }
                    active={user.isActive}
                    icon={
                      user.isActive
                        ? faCircleCheck
                        : faCircleXmark
                    }
                  />

                  <StatusItem
                    label="Approval"
                    value={
                      user.isApproved
                        ? "Approved"
                        : "Pending"
                    }
                    active={user.isApproved}
                    icon={
                      user.isApproved
                        ? faCircleCheck
                        : faClock
                    }
                  />

                  <StatusItem
                    label="Administrator"
                    value={
                      user.isAdmin
                        ? "Administrator"
                        : "Standard User"
                    }
                    active={user.isAdmin}
                    icon={faShieldHalved}
                  />

                  <StatusItem
                    label="Role"
                    value={getRoleLabel(
                      user.role
                    )}
                    active
                    icon={faUserTie}
                  />

                </div>

              </CardBody>

            </Card>

            {/* GROUPS */}

            <Card className="user-view-card">

              <CardBody>

                <div className="user-view-card-header">

                  <div className="user-view-section-icon blue">
                    <FontAwesomeIcon
                      icon={faUsers}
                    />
                  </div>

                  <div>
                    <h5>
                      Groups
                    </h5>

                    <p>
                      User group memberships
                    </p>
                  </div>

                </div>

                {user.groups?.length > 0 ? (

                  <div className="user-view-groups">

                    {user.groups.map(
                      (group, index) => (
                        <span
                          className="user-view-group"
                          key={
                            group?._id ||
                            group ||
                            index
                          }
                        >
                          <FontAwesomeIcon
                            icon={faLayerGroup}
                          />

                          {group?.name ||
                            group?._id ||
                            group}
                        </span>
                      )
                    )}

                  </div>

                ) : (

                  <div className="user-view-no-data">

                    <FontAwesomeIcon
                      icon={faUsers}
                    />

                    <span>
                      No groups assigned
                    </span>

                  </div>

                )}

              </CardBody>

            </Card>

            {/* ACCOUNT DETAILS */}

            <Card className="user-view-card">

              <CardBody>

                <div className="user-view-card-header">

                  <div className="user-view-section-icon gray">
                    <FontAwesomeIcon
                      icon={faIdBadge}
                    />
                  </div>

                  <div>
                    <h5>
                      Account Details
                    </h5>

                    <p>
                      System information
                    </p>
                  </div>

                </div>

                <div className="user-view-account-details">

                  <DetailRow
                    label="User ID"
                    value={user._id}
                  />

                  <DetailRow
                    label="Registered"
                    value={formatDateTime(
                      user.createdAt
                    )}
                  />

                  <DetailRow
                    label="Last Updated"
                    value={formatDateTime(
                      user.updatedAt
                    )}
                  />

                  <DetailRow
                    label="Last Login"
                    value={formatDateTime(
                      user?.lastLogin
                    )}
                  />

                </div>

              </CardBody>

            </Card>

          </Col>

        </Row>

      </Container>

    </div>
  );
};

// =============================================================
// INFO ITEM
// =============================================================

const InfoItem = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="user-view-info-item">

      <div className="user-view-info-icon">
        <FontAwesomeIcon icon={icon} />
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
};

// =============================================================
// STATUS ITEM
// =============================================================

const StatusItem = ({
  label,
  value,
  active,
  icon,
}) => {
  return (
    <div className="user-view-status-item">

      <div className="status-item-left">

        <FontAwesomeIcon
          icon={icon}
          className={
            active
              ? "status-success"
              : "status-muted"
          }
        />

        <span>
          {label}
        </span>

      </div>

      <strong
        className={
          active
            ? "status-success"
            : "status-muted"
        }
      >
        {value}
      </strong>

    </div>
  );
};

// =============================================================
// DETAIL ROW
// =============================================================

const DetailRow = ({
  label,
  value,
}) => {
  return (
    <div className="user-view-detail-row">

      <span>
        {label}
      </span>

      <strong title={value}>
        {value}
      </strong>

    </div>
  );
};

export default UserView;