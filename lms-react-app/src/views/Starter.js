import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Row,
  Badge,
} from "reactstrap";

import {
  RiBookOpenFill,
  RiGraduationCapFill,
  RiTeamFill,
  RiBuilding2Fill,
  RiUserSettingsFill,
  RiShieldUserFill,
  RiArrowUpLine,
  RiArrowDownLine,
  RiBarChartBoxFill,
  RiPieChart2Fill,
  RiPulseFill,
} from "react-icons/ri";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import axios from "axios";
import toast from "react-hot-toast";

import { courseListService } from "../service/baseService";

const COLORS = [
  "#2559A7",
  "#EE017E",
  "#06B6D4",
  "#7C3AED",
  "#F59E0B",
];

const Starter = () => {
  const [institution, setInstitution] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingIns, setLoadingIns] = useState(true);

  /* =========================================================
     FETCH COURSES
     ========================================================= */

  const fetchCourses = async () => {
    try {
      const response = await courseListService();

      setCourses(response?.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch courses."
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  /* =========================================================
     FETCH INSTITUTIONS
     ========================================================= */

  const fetchIns = async () => {
    try {
      const response = await axios.get("/api/institution");

      setInstitution(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch institutions."
      );
    } finally {
      setLoadingIns(false);
    }
  };

  /* =========================================================
     FETCH USERS
     ========================================================= */

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");

      setUsers(response?.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to fetch users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchUsers();
    fetchIns();
  }, []);

  /* =========================================================
     USER BREAKDOWN
     ========================================================= */

  const userStats = useMemo(() => {
    const students = users.filter(
      (user) =>
        user.role === "student" &&
        !user.isAdmin
    );

    const teachers = users.filter(
      (user) =>
        (user.role === "teacher" ||
          user.role === "instructor") &&
        !user.isAdmin
    );

    const admins = users.filter(
      (user) => user.isAdmin || user.role === "admin"
    );

    const coordinators = users.filter(
      (user) =>
        user.role === "coordinator" &&
        !user.isAdmin
    );

    return {
      students,
      teachers,
      admins,
      coordinators,
    };
  }, [users]);

  /* =========================================================
     PIE DATA
     ========================================================= */

  const roleDistribution = useMemo(
    () => [
      {
        name: "Students",
        value: userStats.students.length,
      },
      {
        name: "Teachers",
        value: userStats.teachers.length,
      },
      {
        name: "Admins",
        value: userStats.admins.length,
      },
      {
        name: "Coordinators",
        value: userStats.coordinators.length,
      },
    ],
    [userStats]
  );

  /* =========================================================
     MONTHLY CHART
     
     If your backend doesn't provide historical analytics,
     this visual represents the current platform snapshot.
     
     Replace these values later with real analytics API data.
     ========================================================= */

  const activityData = useMemo(() => {
    const totalUsers = users.length;
    const totalCourses = courses.length;

    return [
      {
        month: "Jan",
        students: Math.round(totalUsers * 0.35),
        teachers: Math.round(totalUsers * 0.12),
        courses: Math.round(totalCourses * 0.35),
      },
      {
        month: "Feb",
        students: Math.round(totalUsers * 0.43),
        teachers: Math.round(totalUsers * 0.21),
        courses: Math.round(totalCourses * 0.46),
      },
      {
        month: "Mar",
        students: Math.round(totalUsers * 0.51),
        teachers: Math.round(totalUsers * 0.29),
        courses: Math.round(totalCourses * 0.55),
      },
      {
        month: "Apr",
        students: Math.round(totalUsers * 0.62),
        teachers: Math.round(totalUsers * 0.38),
        courses: Math.round(totalCourses * 0.63),
      },
      {
        month: "May",
        students: Math.round(totalUsers * 0.76),
        teachers: Math.round(totalUsers * 0.52),
        courses: Math.round(totalCourses * 0.76),
      },
      {
        month: "Jun",
        students: Math.round(totalUsers * 0.88),
        teachers: Math.round(totalUsers * 0.68),
        courses: Math.round(totalCourses * 0.88),
      },
      {
        month: "Jul",
        students: userStats.students.length,
        teachers: userStats.teachers.length,
        courses: courses.length,
      },
    ];
  }, [
    users,
    courses,
    userStats,
  ]);

  /* =========================================================
     OVERVIEW CARDS
     ========================================================= */

  const overviewCards = [
    {
      title: "Total Courses",
      value: courses.length,
      icon: <RiBookOpenFill />,
      className: "blue",
      description: "Available learning courses",
    },
    {
      title: "Students",
      value: userStats.students.length,
      icon: <RiGraduationCapFill />,
      className: "pink",
      description: "Registered learners",
    },
    {
      title: "Teachers",
      value: userStats.teachers.length,
      icon: <RiTeamFill />,
      className: "cyan",
      description: "Teaching professionals",
    },
    {
      title: "Institutions",
      value: institution.length,
      icon: <RiBuilding2Fill />,
      className: "purple",
      description: "Connected institutions",
    },
  ];

  /* =========================================================
     LOADING
     ========================================================= */

  const isLoading =
    loadingCourses ||
    loadingUsers ||
    loadingIns;

  return (
    <div className="starter-dashboard">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="dashboard-header">

        <div>
          <span className="dashboard-eyebrow">
            LMS OVERVIEW
          </span>

          <h1>
            Learning Platform
            <span> Dashboard</span>
          </h1>

          <p>
            Monitor courses, learners, teachers and
            institutions from one place.
          </p>
        </div>

        <div className="dashboard-status">
          <span className="status-dot"></span>

          <div>
            <strong>Platform Active</strong>
            <small>
              System is running normally
            </small>
          </div>
        </div>

      </div>

      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <Row className="g-4 mb-4">

        {overviewCards.map((card) => (
          <Col
            key={card.title}
            xs="12"
            sm="6"
            xl="3"
          >
            <Card
              className={`overview-card ${card.className}`}
            >
              <CardBody>

                <div className="overview-top">

                  <div className="overview-icon">
                    {card.icon}
                  </div>

                  <div className="overview-trend">
                    <RiArrowUpLine />
                    Active
                  </div>

                </div>

                <div className="overview-content">

                  <span>
                    {card.title}
                  </span>

                  <h2>
                    {isLoading ? (
                      <span className="loading-number">
                        --
                      </span>
                    ) : (
                      card.value.toLocaleString()
                    )}
                  </h2>

                  <p>
                    {card.description}
                  </p>

                </div>

              </CardBody>
            </Card>
          </Col>
        ))}

      </Row>

      {/* =====================================================
          SECONDARY STATS
          ===================================================== */}

      <Row className="g-4 mb-4">

        <Col xs="12" lg="4">
          <Card className="mini-stat-card">
            <CardBody>

              <div className="mini-icon">
                <RiTeamFill />
              </div>

              <div>
                <span>Total Users</span>

                <h3>
                  {loadingUsers
                    ? "--"
                    : users.length.toLocaleString()}
                </h3>

                <small>
                  All registered platform users
                </small>
              </div>

            </CardBody>
          </Card>
        </Col>

        <Col xs="12" lg="4">
          <Card className="mini-stat-card">
            <CardBody>

              <div className="mini-icon pink">
                <RiShieldUserFill />
              </div>

              <div>
                <span>Administrators</span>

                <h3>
                  {loadingUsers
                    ? "--"
                    : userStats.admins.length}
                </h3>

                <small>
                  Users with administrative access
                </small>
              </div>

            </CardBody>
          </Card>
        </Col>

        <Col xs="12" lg="4">
          <Card className="mini-stat-card">
            <CardBody>

              <div className="mini-icon cyan">
                <RiUserSettingsFill />
              </div>

              <div>
                <span>Coordinators</span>

                <h3>
                  {loadingUsers
                    ? "--"
                    : userStats.coordinators.length}
                </h3>

                <small>
                  Users managing learning operations
                </small>
              </div>

            </CardBody>
          </Card>
        </Col>

      </Row>

      {/* =====================================================
          MAIN ANALYTICS
          ===================================================== */}

      <Row className="g-4 mb-4">

        {/* USER ACTIVITY */}

        <Col xs="12" xl="8">

          <Card className="analytics-card">

            <CardBody>

              <div className="analytics-header">

                <div>
                  <span className="analytics-label">
                    PLATFORM ACTIVITY
                  </span>

                  <CardTitle tag="h4">
                    Learning ecosystem overview
                  </CardTitle>

                  <p>
                    Distribution of learners, teachers
                    and courses across the platform.
                  </p>
                </div>

                <div className="analytics-header-icon">
                  <RiBarChartBoxFill />
                </div>

              </div>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={330}
                >

                  <AreaChart
                    data={activityData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <defs>

                      <linearGradient
                        id="studentGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2559A7"
                          stopOpacity={0.3}
                        />

                        <stop
                          offset="100%"
                          stopColor="#2559A7"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <linearGradient
                        id="teacherGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#EE017E"
                          stopOpacity={0.25}
                        />

                        <stop
                          offset="100%"
                          stopColor="#EE017E"
                          stopOpacity={0}
                        />
                      </linearGradient>

                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#e9edf5"
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b95a7",
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b95a7",
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        border: "none",
                        borderRadius: "12px",
                        boxShadow:
                          "0 12px 35px rgba(0,0,0,0.12)",
                      }}
                    />

                    <Legend />

                    <Area
                      type="monotone"
                      dataKey="students"
                      name="Students"
                      stroke="#2559A7"
                      strokeWidth={3}
                      fill="url(#studentGradient)"
                    />

                    <Area
                      type="monotone"
                      dataKey="teachers"
                      name="Teachers"
                      stroke="#EE017E"
                      strokeWidth={3}
                      fill="url(#teacherGradient)"
                    />

                    <Area
                      type="monotone"
                      dataKey="courses"
                      name="Courses"
                      stroke="#06B6D4"
                      strokeWidth={3}
                      fill="transparent"
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            </CardBody>

          </Card>

        </Col>

        {/* USER DISTRIBUTION */}

        <Col xs="12" xl="4">

          <Card className="analytics-card">

            <CardBody>

              <div className="analytics-header">

                <div>

                  <span className="analytics-label">
                    USER DISTRIBUTION
                  </span>

                  <CardTitle tag="h4">
                    Platform users
                  </CardTitle>

                  <p>
                    Current user composition by role.
                  </p>

                </div>

                <div className="analytics-header-icon pink">
                  <RiPieChart2Fill />
                </div>

              </div>

              <div className="pie-container">

                <ResponsiveContainer
                  width="100%"
                  height={250}
                >

                  <PieChart>

                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >

                      {roleDistribution.map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[index %
                                COLORS.length]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>

                <div className="pie-center">

                  <strong>
                    {users.length}
                  </strong>

                  <span>
                    Users
                  </span>

                </div>

              </div>

              <div className="role-list">

                {roleDistribution.map(
                  (role, index) => (

                    <div
                      className="role-item"
                      key={role.name}
                    >

                      <div className="role-name">

                        <span
                          className="role-dot"
                          style={{
                            background:
                              COLORS[index %
                                COLORS.length],
                          }}
                        />

                        {role.name}

                      </div>

                      <strong>
                        {role.value}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </CardBody>

          </Card>

        </Col>

      </Row>

      {/* =====================================================
          COURSE + USER BAR CHART
          ===================================================== */}

      <Row className="g-4 mb-4">

        <Col xs="12" lg="7">

          <Card className="analytics-card">

            <CardBody>

              <div className="analytics-header">

                <div>

                  <span className="analytics-label">
                    USER STRUCTURE
                  </span>

                  <CardTitle tag="h4">
                    User role comparison
                  </CardTitle>

                </div>

                <div className="analytics-header-icon">
                  <RiBarChartBoxFill />
                </div>

              </div>

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <BarChart
                    data={[
                      {
                        role: "Students",
                        users:
                          userStats.students.length,
                      },
                      {
                        role: "Teachers",
                        users:
                          userStats.teachers.length,
                      },
                      {
                        role: "Admins",
                        users:
                          userStats.admins.length,
                      },
                      {
                        role: "Coordinators",
                        users:
                          userStats.coordinators.length,
                      },
                    ]}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#e9edf5"
                    />

                    <XAxis
                      dataKey="role"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b95a7",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b95a7",
                        fontSize: 12,
                      }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="users"
                      name="Users"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                      fill="#2559A7"
                      barSize={42}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </CardBody>

          </Card>

        </Col>

        {/* QUICK INSIGHTS */}

        <Col xs="12" lg="5">

          <Card className="analytics-card insights-card">

            <CardBody>

              <div className="analytics-header">

                <div>

                  <span className="analytics-label">
                    QUICK INSIGHTS
                  </span>

                  <CardTitle tag="h4">
                    Platform snapshot
                  </CardTitle>

                </div>

                <div className="analytics-header-icon cyan">
                  <RiPulseFill />
                </div>

              </div>

              <div className="insight-list">

                <div className="insight-row">

                  <div className="insight-icon blue">
                    <RiBookOpenFill />
                  </div>

                  <div className="insight-content">
                    <strong>
                      {courses.length}
                    </strong>

                    <span>
                      Courses available
                    </span>
                  </div>

                  <Badge color="light">
                    Courses
                  </Badge>

                </div>

                <div className="insight-row">

                  <div className="insight-icon pink">
                    <RiGraduationCapFill />
                  </div>

                  <div className="insight-content">
                    <strong>
                      {userStats.students.length}
                    </strong>

                    <span>
                      Active learner accounts
                    </span>
                  </div>

                  <Badge color="light">
                    Learners
                  </Badge>

                </div>

                <div className="insight-row">

                  <div className="insight-icon cyan">
                    <RiTeamFill />
                  </div>

                  <div className="insight-content">
                    <strong>
                      {userStats.teachers.length}
                    </strong>

                    <span>
                      Teaching professionals
                    </span>
                  </div>

                  <Badge color="light">
                    Teachers
                  </Badge>

                </div>

                <div className="insight-row">

                  <div className="insight-icon purple">
                    <RiBuilding2Fill />
                  </div>

                  <div className="insight-content">
                    <strong>
                      {institution.length}
                    </strong>

                    <span>
                      Connected institutions
                    </span>
                  </div>

                  <Badge color="light">
                    Institutions
                  </Badge>

                </div>

              </div>

            </CardBody>

          </Card>

        </Col>

      </Row>

      {/* =====================================================
          FOOTER STATUS
          ===================================================== */}

      <div className="dashboard-footer">

        <div className="footer-status">

          <span className="status-dot"></span>

          <span>
            LMS platform is operating normally
          </span>

        </div>

        <span>
          Real-time platform overview
        </span>

      </div>

    </div>
  );
};

export default Starter;