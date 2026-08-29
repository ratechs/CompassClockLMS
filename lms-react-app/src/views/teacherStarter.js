import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Col,
  Row,
} from "reactstrap";
import {
  RiBookOpenFill,
  RiGraduationCapFill,
  RiTeamFill,
} from "react-icons/ri";
import { useGroup } from "../hooks/Groups/useGroups";
import { courseListService } from "../service/baseService";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext, useAuthcontext } from "../contexts/Authcontext";
import Courses from "../components/courses/Courses";

const Starter = () => {
  const { group, loading } = useGroup();
  const {authUser} = useAuthcontext();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const response = await courseListService();
      const currentUserCourse = response.data.filter((c) => c.created_by === authUser?.user?._id)
      setCourses(currentUserCourse);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      const allUsers = response.data;
      setUsers(allUsers);
      // Categorize users
      setStudents(allUsers.filter(user => user.role === "student" && !user.isAdmin));
      setTeachers(allUsers.filter(user => user.role === "teacher" && !user.isAdmin));
      setAdmins(allUsers.filter(user => user.isAdmin));
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage =
        error.response?.data?.message || "Error fetching users. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Run on component mount
  useEffect(() => {
    fetchCourses();
    fetchUsers();
  }, []);

  return (
    <div>
      <Row className="cg-4 rg-2">
        {/* Courses Card */}
        <Col sm="6" lg="3" xl="3" xxl="3">
          <Card className="shadow border-0 rounded-4 p-3 position-relative overflow-hidden stat-card">
            <div className="d-flex align-items-center gap-3">
              <div className="icon-circle bg-light-primary rounded-circle d-flex justify-content-center align-items-center" style={{ width: 60, height: 60 }}>
                <RiBookOpenFill size={35} color="#000000" />
              </div>
              <div>
                <CardTitle tag="h6" className="fw-semibold text-secondary text-uppercase mb-1">
                  Courses
                </CardTitle>
                <h4 className="fw-bold mb-0 text-dark">
                  {loadingCourses ? (
                    <span className="text-warning">Loading...</span>
                  ) : (
                    <span className="count-text">{courses.length}</span>
                  )}
                </h4>
              </div>
            </div>
          </Card>
        </Col>

      </Row>
      <Row className="cg-4 rg-2 mt-4">
        <Col sm="12" lg="12" xl="12" xxl="12">
          <Courses />
        </Col>
      </Row>
    </div>
  );
};

export default Starter;
