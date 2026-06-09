import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Button,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
} from "reactstrap";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import classnames from "classnames";
import { useAuthcontext } from "../../../contexts/Authcontext";

const TABS = {
  COURSE: "course",
  SUBJECTS: "subjects",
  MATERIALS: "materials",
};

const CourseForm = () => {
  const [activeTab, setActiveTab] = useState(TABS.COURSE);
  const { authUser } = useAuthcontext();
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    name: "",
    description: "",
    duration: "",
    imageUrl: "",
    course_type: "",
    join_code: "",
    subjects: [
      {
        name: "",
        description: "",
        duration: "",
        materials: [
          { name: "", description: "", content_type: "", content_url: "" },
        ],
      },
    ],
    created_by: authUser?.user,
  });

  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseData = async () => {
      if (courseId) {
        setLoading(true);
        try {
          const response = await axios.get(`/api/courses/${courseId}`);
          const fetchedCourseData = response.data;

          const processedData = {
            name: fetchedCourseData.name || "",
            description: fetchedCourseData.description || "",
            duration: fetchedCourseData.duration || "",
            imageUrl: fetchedCourseData.imageUrl || "",
            course_type: fetchedCourseData.course_type || "public",
            join_code: fetchedCourseData.join_code || "",
            subjects: (Array.isArray(fetchedCourseData.subjects)
              ? fetchedCourseData.subjects
              : []
            ).map(subject => ({
              _id: subject._id || "",
              name: subject.name || "",
              description: subject.description || "",
              duration: subject.duration || "",
              materials: (Array.isArray(subject.materials) && subject.materials.length > 0
                ? subject.materials.map(material => ({
                  _id: material._id || "",
                  name: material.name || "",
                  description: material.description || "",
                  content_type: material.content_type || "",
                  content_url: material.content_url || "",
                }))
                : [{
                  name: "",
                  description: "",
                  content_type: "",
                  content_url: "",
                }]
              )
            }))
          };

          if (processedData.subjects.length === 0) {
            processedData.subjects = [{
              name: "",
              description: "",
              duration: "",
              materials: [{
                name: "",
                description: "",
                content_type: "",
                content_url: "",
              }]
            }];
          }

          setCourseData(processedData);
        } catch (error) {
          toast.error("Failed to load course data. Please try again.");
          console.error("Error fetching course:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCourseData();
    // eslint-disable-next-line
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (courseId) {
        await axios.put(`/api/courses/update-course/${courseId}`, courseData);
        toast.success("Course updated successfully!");
      } else {
        const getRandomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const uniqueSuffix = getRandomLetter() + getRandomLetter();
        const generatedJoinCode = `NCL1-${uniqueSuffix}`;
        await axios.post("http://localhost:5000/api/courses/create-course", {
          ...courseData,
          join_code: generatedJoinCode,
        });
        toast.success("Course created successfully!");
      }
      navigate("/teacher/courses");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Error submitting form. Please try again.";
      toast.error(errorMessage);
      console.error("Error submitting course form:",  error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (field, value) => {
    setCourseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...courseData.subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value
    };
    setCourseData({ ...courseData, subjects: updatedSubjects });
  };

  const handleMaterialChange = (subjectIndex, materialIndex, field, value) => {
    const updatedSubjects = [...courseData.subjects];
    const updatedMaterials = [...updatedSubjects[subjectIndex].materials];
    updatedMaterials[materialIndex] = {
      ...updatedMaterials[materialIndex],
      [field]: value
    };
    updatedSubjects[subjectIndex].materials = updatedMaterials;
    setCourseData({ ...courseData, subjects: updatedSubjects });
  };

  const addSubject = () => {
    setCourseData({
      ...courseData,
      subjects: [
        ...courseData.subjects,
        {
          name: "",
          description: "",
          duration: "",
          materials: [
            { name: "", description: "", content_type: "", content_url: "" },
          ],
        },
      ],
    });
  };

  const addMaterial = (subjectIndex) => {
    const updatedSubjects = [...courseData.subjects];
    updatedSubjects[subjectIndex].materials.push({
      name: "",
      description: "",
      content_type: "",
      content_url: "",
    });
    setCourseData({ ...courseData, subjects: updatedSubjects });
  };

  const removeSubject = (subjectIndex) => {
    setCourseData({
      ...courseData,
      subjects: courseData.subjects.filter((_, idx) => idx !== subjectIndex),
    });
  };

  const removeMaterial = (subjectIndex, materialIndex) => {
    const updatedSubjects = [...courseData.subjects];
    updatedSubjects[subjectIndex].materials = updatedSubjects[subjectIndex].materials.filter(
      (_, idx) => idx !== materialIndex
    );
    setCourseData({ ...courseData, subjects: updatedSubjects });
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  if (loading && courseId) {
    return <div className="container mt-4">Loading course data...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-3" style={{ textDecoration: "none" }}>
        {courseId ? "Edit Course" : "Create Course"}
      </h2>
      <Nav
        tabs
        className="flex-nowrap flex-md-wrap overflow-auto mb-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <NavItem className="flex-fill text-center">
          <NavLink
            className={classnames({ active: activeTab === TABS.COURSE })}
            onClick={() => toggleTab(TABS.COURSE)}
            style={{ cursor: "pointer" }}
          >
            Course
          </NavLink>
        </NavItem>
        <NavItem className="flex-fill text-center">
          <NavLink
            className={classnames({ active: activeTab === TABS.SUBJECTS })}
            onClick={() => toggleTab(TABS.SUBJECTS)}
            style={{ cursor: "pointer" }}
          >
            Subjects
          </NavLink>
        </NavItem>
        <NavItem className="flex-fill text-center">
          <NavLink
            className={classnames({ active: activeTab === TABS.MATERIALS })}
            onClick={() => toggleTab(TABS.MATERIALS)}
            style={{ cursor: "pointer" }}
          >
            Materials
          </NavLink>
        </NavItem>
      </Nav>
      <Form onSubmit={handleSubmit}>
        <TabContent activeTab={activeTab}>
          {/* Course Tab */}
          <TabPane tabId={TABS.COURSE} className="p-2 p-md-4">
            <Row>
              <Col xs="12" md="6">
                <FormGroup>
                  <Label for="name">Course Name</Label>
                  <Input
                    type="text"
                    id="name"
                    value={courseData.name}
                    placeholder="Enter course name"
                    onChange={(e) => handleCourseChange("name", e.target.value)}
                    required
                  />
                </FormGroup>
              </Col>
              <Col xs="12" md="6">
                <FormGroup>
                  <Label for="imageUrl">Image URL</Label>
                  <Input
                    type="text"
                    id="imageUrl"
                    value={courseData.imageUrl}
                    placeholder="Enter image URL"
                    onChange={(e) =>
                      handleCourseChange("imageUrl", e.target.value)
                    }
                  />
                </FormGroup>
                {courseData.imageUrl && (
                  <div className="image-preview mt-2">
                    <Label>Image Preview:</Label>
                    <div className="img-preview-container">
                      <img
                        src={courseData.imageUrl}
                        alt="Course Preview"
                        className="img-preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </Col>
            </Row>
            <FormGroup>
              <Label for="description">Description</Label>
              <ReactQuill
                value={courseData.description}
                onChange={(value) => handleCourseChange("description", value)}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline", "strike", "blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
              />
            </FormGroup>
            <Row>
              <Col xs="12" md="6">
                <FormGroup>
                  <Label for="course_type">Course Type</Label>
                  <Input
                    type="select"
                    id="course_type"
                    value={courseData.course_type}
                    onChange={(e) =>
                      handleCourseChange("course_type", e.target.value)
                    }
                    required
                  >
                    <option value="">Select Course Type</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    
                  </Input>
                </FormGroup>
              </Col>
              <Col xs="12" md="6">
                <FormGroup>
                  <Label for="duration">Duration (Months)</Label>
                  <Input
                    type="number"
                    id="duration"
                    value={courseData.duration}
                    placeholder="Enter course duration"
                    onChange={(e) => {
                      handleCourseChange(
                        "duration",
                        e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                      );
                    }}
                    min="1"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
          </TabPane>

          {/* Subjects Tab */}
          <TabPane tabId={TABS.SUBJECTS} className="p-2 p-md-4">
            {courseData.subjects.map((subject, subjectIndex) => (
              <div key={subject._id || subjectIndex} className="mb-3 border rounded p-2 p-md-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Subject {subjectIndex + 1}</h5>
                  {courseData.subjects.length > 1 && (
                    <Button
                      color="danger"
                      size="sm"
                      type="button"
                      onClick={() => removeSubject(subjectIndex)}
                    >
                      <i className="bi bi-x-circle-fill"></i> Remove Subject
                    </Button>
                  )}
                </div>
                <FormGroup>
                  <Label for={`subject-name-${subjectIndex}`}>
                    Subject Name
                  </Label>
                  <Input
                    type="text"
                    id={`subject-name-${subjectIndex}`}
                    value={subject.name}
                    onChange={(e) =>
                      handleSubjectChange(
                        subjectIndex,
                        "name",
                        e.target.value
                      )
                    }
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for={`subject-description-${subjectIndex}`}>
                    Subject Description
                  </Label>
                  <ReactQuill
                    value={subject.description}
                    onChange={(value) =>
                      handleSubjectChange(subjectIndex, "description", value)
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label for={`subject-duration-${subjectIndex}`}>
                    Subject Duration (Months)
                  </Label>
                  <Input
                    type="number"
                    id={`subject-duration-${subjectIndex}`}
                    value={subject.duration}
                    onChange={(e) =>
                      handleSubjectChange(
                        subjectIndex,
                        "duration",
                        e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                      )
                    }
                    min="1"
                    required
                  />
                </FormGroup>
              </div>
            ))}
            <Button color="primary" block type="button" onClick={addSubject}>
              <i className="bi bi-plus-circle-fill"></i> Add Subject
            </Button>
          </TabPane>

          {/* Materials Tab */}
          <TabPane tabId={TABS.MATERIALS} className="p-2 p-md-4">
            {courseData.subjects.map((subject, subjectIndex) => (
              <div key={subject._id || subjectIndex} className="mb-4 border rounded p-2 p-md-3">
                <h5>{subject.name || `Subject ${subjectIndex + 1}`} Materials</h5>
                {subject.materials.map((material, materialIndex) => (
                  <div key={material._id || materialIndex} className="my-3 border-bottom pb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Material {materialIndex + 1}</span>
                      {subject.materials.length > 1 && (
                        <Button
                          color="danger"
                          size="sm"
                          type="button"
                          onClick={() => removeMaterial(subjectIndex, materialIndex)}
                        >
                          <i className="bi bi-x-circle-fill"></i> Remove Material
                        </Button>
                      )}
                    </div>
                    <FormGroup>
                      <Label for={`material-name-${subjectIndex}-${materialIndex}`}>
                        Material Name
                      </Label>
                      <Input
                        type="text"
                        id={`material-name-${subjectIndex}-${materialIndex}`}
                        value={material.name}
                        onChange={(e) =>
                          handleMaterialChange(
                            subjectIndex,
                            materialIndex,
                            "name",
                            e.target.value
                          )
                        }
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label for={`material-description-${subjectIndex}-${materialIndex}`}>
                        Material Description
                      </Label>
                      <Input
                        type="textarea"
                        id={`material-description-${subjectIndex}-${materialIndex}`}
                        value={material.description}
                        onChange={(e) =>
                          handleMaterialChange(
                            subjectIndex,
                            materialIndex,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label for={`material-content_type-${subjectIndex}-${materialIndex}`}>
                        Content Type
                      </Label>
                      <Input
                        type="select"
                        id={`material-content_type-${subjectIndex}-${materialIndex}`}
                        value={material.content_type}
                        onChange={(e) =>
                          handleMaterialChange(
                            subjectIndex,
                            materialIndex,
                            "content_type",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">Select Content Type</option>
                        <option value="PDF">PDF</option>
                        <option value="Video">Video</option>
                        <option value="Document">Document</option>
                        <option value="Image">Image</option>
                        <option value="Link">Link</option>
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Label for={`material-content_url-${subjectIndex}-${materialIndex}`}>
                        Content URL
                      </Label>
                      <Input
                        type="url"
                        id={`material-content_url-${subjectIndex}-${materialIndex}`}
                        value={material.content_url}
                        onChange={(e) =>
                          handleMaterialChange(
                            subjectIndex,
                            materialIndex,
                            "content_url",
                            e.target.value
                          )
                        }
                        required
                      />
                    </FormGroup>
                  </div>
                ))}
                <Button
                  color="primary"
                  block
                  type="button"
                  onClick={() => addMaterial(subjectIndex)}
                >
                  <i className="bi bi-plus-circle-fill"></i> Add Material
                </Button>
              </div>
            ))}
          </TabPane>
        </TabContent>
        <Button color="success" type="submit" block className="mt-3" disabled={loading}>
          {loading ? "Processing..." : (courseId ? "Update Course" : "Create Course")}
        </Button>
      </Form>
    </div>
  );
};

export default CourseForm;