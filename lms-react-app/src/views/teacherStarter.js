import React, { useEffect, useState } from "react";

import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Row,
  Button,
} from "reactstrap";

import {
  RiBookOpenFill,
  RiGraduationCapFill,
  RiFileTextFill,
  RiTeamFill,
  RiRefreshLine,
  RiAddLine,
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiTimeFill,
} from "react-icons/ri";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import { useAuthcontext } from "../contexts/Authcontext";
import Courses from "../components/courses/Courses";

const Starter = () => {
  const { authUser } = useAuthcontext();
  const navigate = useNavigate();

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [dashboard, setDashboard] = useState({
    courseCount: 0,
    testCount: 0,
    studentCount: 0,
    requests: {
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --------------------------------------------------
  // Current user
  // --------------------------------------------------

  const currentUserId = authUser?.user?._id;

  const teacherName =
    authUser?.user?.fullname ||
    authUser?.user?.username ||
    "Teacher";

  // --------------------------------------------------
  // Fetch dashboard
  // --------------------------------------------------

  const fetchDashboardData = async () => {
    if (!currentUserId) {
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `/api/users/dashboard/${currentUserId}`
      );

      if (response.data?.success) {
        setDashboard(
          response.data.data || {
            courseCount: 0,
            testCount: 0,
            studentCount: 0,
            requests: {
              total: 0,
              approved: 0,
              rejected: 0,
              pending: 0,
            },
          }
        );
      } else {
        setDashboard({
          courseCount: 0,
          testCount: 0,
          studentCount: 0,
          requests: {
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0,
          },
        });
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      const message =
        error.response?.data?.message ||
        "Unable to load teacher dashboard";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    if (currentUserId) {
      fetchDashboardData();
    }
  }, [currentUserId]);

  // --------------------------------------------------
  // Refresh
  // --------------------------------------------------

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await fetchDashboardData();

      toast.success("Dashboard refreshed");
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  // --------------------------------------------------
  // Safe value
  // --------------------------------------------------

  const getValue = (value) => {
    if (loading) {
      return "...";
    }

    return value ?? 0;
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="teacher-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="teacher-dashboard-header">

        <div className="teacher-dashboard-header-left">

          <div className="teacher-dashboard-avatar">
            <RiGraduationCapFill size={30} />
          </div>

          <div className="teacher-dashboard-heading">
            <h1>Teacher Dashboard</h1>

            <p>
              Welcome back,{" "}
              <strong>{teacherName}</strong>
            </p>
          </div>

        </div>

        <Button
          type="button"
          className="teacher-refresh-button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RiRefreshLine
            size={19}
            className={
              refreshing
                ? "teacher-refresh-icon spinning"
                : "teacher-refresh-icon"
            }
          />

          <span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </Button>

      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <Row className="teacher-stat-row">

        {/* MY COURSES */}

        <Col
          xs="12"
          sm="6"
          lg="3"
          className="teacher-stat-column"
        >
          <Card className="teacher-stat-card">
            <CardBody>

              <div className="teacher-stat-inner">

                <div className="teacher-stat-icon courses">
                  <RiBookOpenFill size={28} />
                </div>

                <div className="teacher-stat-details">

                  <CardTitle tag="div">
                    My Courses
                  </CardTitle>

                  <div className="teacher-stat-number">
                    {getValue(dashboard.courseCount)}
                  </div>

                  <span>
                    Courses created by you
                  </span>

                </div>

              </div>

            </CardBody>
          </Card>
        </Col>

        {/* STUDENTS */}

        <Col
          xs="12"
          sm="6"
          lg="3"
          className="teacher-stat-column"
        >
          <Card className="teacher-stat-card">
            <CardBody>

              <div className="teacher-stat-inner">

                <div className="teacher-stat-icon students">
                  <RiGraduationCapFill size={28} />
                </div>

                <div className="teacher-stat-details">

                  <CardTitle tag="div">
                    Students
                  </CardTitle>

                  <div className="teacher-stat-number">
                    {getValue(dashboard.studentCount)}
                  </div>

                  <span>
                    Unique enrolled students
                  </span>

                </div>

              </div>

            </CardBody>
          </Card>
        </Col>

        {/* TESTS */}

        <Col
          xs="12"
          sm="6"
          lg="3"
          className="teacher-stat-column"
        >
          <Card className="teacher-stat-card">
            <CardBody>

              <div className="teacher-stat-inner">

                <div className="teacher-stat-icon tests">
                  <RiFileTextFill size={28} />
                </div>

                <div className="teacher-stat-details">

                  <CardTitle tag="div">
                    Tests
                  </CardTitle>

                  <div className="teacher-stat-number">
                    {getValue(dashboard.testCount)}
                  </div>

                  <span>
                    Tests in your courses
                  </span>

                </div>

              </div>

            </CardBody>
          </Card>
        </Col>

        {/* TOTAL REQUESTS */}

        <Col
          xs="12"
          sm="6"
          lg="3"
          className="teacher-stat-column"
        >
          <Card className="teacher-stat-card">
            <CardBody>

              <div className="teacher-stat-inner">

                <div className="teacher-stat-icon requests">
                  <RiTeamFill size={28} />
                </div>

                <div className="teacher-stat-details">

                  <CardTitle tag="div">
                    Join Requests
                  </CardTitle>

                  <div className="teacher-stat-number">
                    {getValue(
                      dashboard.requests?.total
                    )}
                  </div>

                  <span>
                    Total course requests
                  </span>

                </div>

              </div>

            </CardBody>
          </Card>
        </Col>

      </Row>

      {/* =====================================================
          REQUEST STATUS
      ===================================================== */}

      <Card className="teacher-request-card">

        <CardBody>

          <div className="teacher-section-heading">

            <div>
              <h3>Join Request Status</h3>

              <p>
                Overview of student requests for your courses
              </p>
            </div>

          </div>

          <div className="teacher-request-grid">

            {/* Pending */}

            <div className="teacher-request-item pending">

              <div className="teacher-request-icon">
                <RiTimeFill size={23} />
              </div>

              <div className="teacher-request-info">

                <span>Pending</span>

                <strong>
                  {getValue(
                    dashboard.requests?.pending
                  )}
                </strong>

              </div>

            </div>

            {/* Approved */}

            <div className="teacher-request-item approved">

              <div className="teacher-request-icon">
                <RiCheckboxCircleFill size={23} />
              </div>

              <div className="teacher-request-info">

                <span>Approved</span>

                <strong>
                  {getValue(
                    dashboard.requests?.approved
                  )}
                </strong>

              </div>

            </div>

            {/* Rejected */}

            <div className="teacher-request-item rejected">

              <div className="teacher-request-icon">
                <RiCloseCircleFill size={23} />
              </div>

              <div className="teacher-request-info">

                <span>Rejected</span>

                <strong>
                  {getValue(
                    dashboard.requests?.rejected
                  )}
                </strong>

              </div>

            </div>

            {/* Total */}

            <div className="teacher-request-item total">

              <div className="teacher-request-icon">
                <RiTeamFill size={23} />
              </div>

              <div className="teacher-request-info">

                <span>Total</span>

                <strong>
                  {getValue(
                    dashboard.requests?.total
                  )}
                </strong>

              </div>

            </div>

          </div>

        </CardBody>

      </Card>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      {/* <Card className="teacher-quick-card">

        <CardBody>

          <div className="teacher-section-heading">

            <div>
              <h3>Quick Actions</h3>

              <p>
                Manage your teaching activities
              </p>
            </div>

          </div>

          <div className="teacher-quick-actions">

            <button
              type="button"
              className="teacher-quick-action"
              onClick={() =>
                navigate("/teacher/courses/create")
              }
            >

              <div className="teacher-quick-action-icon">
                <RiAddLine size={22} />
              </div>

              <div className="teacher-quick-action-content">

                <strong>
                  Create Course
                </strong>

                <span>
                  Create a new course
                </span>

              </div>

              <RiArrowRightLine
                size={19}
                className="teacher-action-arrow"
              />

            </button>

            <button
              type="button"
              className="teacher-quick-action"
              onClick={() =>
                navigate("/teacher/students")
              }
            >

              <div className="teacher-quick-action-icon students">
                <RiGraduationCapFill size={21} />
              </div>

              <div className="teacher-quick-action-content">

                <strong>
                  View Students
                </strong>

                <span>
                  Manage your students
                </span>

              </div>

              <RiArrowRightLine
                size={19}
                className="teacher-action-arrow"
              />

            </button>

            <button
              type="button"
              className="teacher-quick-action"
              onClick={() =>
                navigate("/teacher/materials")
              }
            >

              <div className="teacher-quick-action-icon materials">
                <RiFileTextFill size={21} />
              </div>

              <div className="teacher-quick-action-content">

                <strong>
                  Learning Materials
                </strong>

                <span>
                  Manage course materials
                </span>

              </div>

              <RiArrowRightLine
                size={19}
                className="teacher-action-arrow"
              />

            </button>

          </div>

        </CardBody>

      </Card> */}

      {/* =====================================================
          MY COURSES
      ===================================================== */}
{/* 
      <Card className="teacher-courses-card">

        <CardBody className="teacher-courses-body">

          <div className="teacher-courses-header">

            <div className="teacher-courses-title">

              <div className="teacher-courses-icon">
                <RiBookOpenFill size={21} />
              </div>

              <div>
                <h3> Courses</h3>

                <p>
                  Courses created and managed by you
                </p>
              </div>

            </div>

            <div className="teacher-course-count">

              {loading
                ? "Loading..."
                : `${dashboard.courseCount} ${
                    dashboard.courseCount === 1
                      ? "Course"
                      : "Courses"
                  }`}

            </div>

          </div>

          <div className="teacher-courses-content">
            <Courses />
          </div>

        </CardBody>

      </Card> */}

    </div>
  );
};

export default Starter;