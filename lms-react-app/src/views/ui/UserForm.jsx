import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

const initialFormState = {
  fullname:"",
  username: "",
  email: "",
  password: "",
  isAdmin: false,
  isActive: true,
  role: "student",
  profilePicture: "",
  institution: "",
  phoneNumber: "",
  educationLevel: "",
  schoolClass: "",
  collegeDegree: "",
  customCollegeDegree: "",
  experience: "",
  expertise: "",
};

const UserForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState(initialFormState);
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [clLevels] = useState([
    { label: "Class 6", value: "class_6" },
    { label: "Class 7", value: "class_7" },
    { label: "Class 8", value: "class_8" },
    { label: "Class 9", value: "class_9" },
    { label: "Class 10", value: "class_10" },
    { label: "Class 11", value: "class_11" },
    { label: "Class 12", value: "class_12" },
  ]);
  const [cdLevels] = useState([
    { label: "BSc", value: "bsc" },
    { label: "BA", value: "ba" },
    { label: "BCA", value: "bca" },
    { label: "BCom", value: "bcom" },
    { label: "BBA", value: "bba" },
    { label: "BE", value: "be" },
    { label: "BS", value: "bs" },
    { label: "MSc", value: "msc" },
    { label: "MA", value: "ma" },
    { label: "MCA", value: "mca" },
    { label: "MCom", value: "mcom" },
    { label: "MBA", value: "mba" },
    { label: "ME", value: "me" },
    { label: "MS", value: "ms" },
    { label: "Other", value: "other" },
  ]);

  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      axios.get(`/api/users/${id}`).then((res) => {
        const user = res.data;
        setFormData({
          ...initialFormState,
          ...user,
          password: "",
          phoneNumber: user.phoneNumber || "",
          experience: user.experience || 0,
          educationLevel: user.educationLevel || "",
          expertise: user?.expertise || ""
        });
      });
    }


    
  }, [id]);

  useEffect(() => {
    axios.get(`/api/institution`).then((res) => {
      setInstitutions(res.data.data);
    });
  }, []);

  const getFilteredInstitutions = () => {
    return institutions;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        console.log("The format data", formData);
        
        await axios.put(`/api/users/${id}`, formData);
        toast.success("User updated successfully!");
      } else {
        await axios.post("/api/users", formData);
        toast.success("User created successfully!");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("An error occurred. Please try again.");
    }
  };
    console.log("The format data", formData);
  return (
    <form onSubmit={handleSubmit} className="user-form">
      <h3>{isEditMode ? "Edit User" : "Create New User"}</h3>
      <div className="form-grid">

        <div className="form-group">
          <label htmlFor="fullname">Full Name</label>
          <input id="fullname" name="fullname" value={formData.fullname} onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" value={formData.username} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" value={formData.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
            <option value="coordinator">Coordinator</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="institution">Institution</label>
          <select
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
          >
            <option value="">Select Institution</option>
            {getFilteredInstitutions().map((ins) => (
              <option key={ins._id} value={ins._id}>
                {ins.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="educationLevel">Education Level</label>
          <select
            id="educationLevel"
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleChange}
          >
            <option value="">Select Education Level</option>
            <option value="school">School</option>
            <option value="college">College</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>

        {formData.educationLevel === "school" && (
          <div className="form-group">
            <label htmlFor="schoolClass">School Class</label>
            <select
              id="schoolClass"
              name="schoolClass"
              value={formData.schoolClass}
              onChange={handleChange}
            >
              <option value="">Select Class</option>
              {clLevels.map((cl) => (
                <option key={cl.value} value={cl.value}>
                  {cl.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.educationLevel !== "school" && (
          <>
            <div className="form-group">
              <label htmlFor="collegeDegree">College Degree</label>
              <select
                id="collegeDegree"
                name="collegeDegree"
                value={formData.collegeDegree}
                onChange={handleChange}
              >
                <option value="">Select Degree</option>
                {cdLevels.map((cd) => (
                  <option key={cd.value} value={cd.value}>
                    {cd.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.collegeDegree === "other" && (
              <div className="form-group">
                <label htmlFor="customCollegeDegree">Custom Degree</label>
                <input
                  id="customCollegeDegree"
                  name="customCollegeDegree"
                  value={formData.customCollegeDegree}
                  onChange={handleChange}
                />
              </div>
            )}
          </>
        )}

        {formData.role === "teacher" && (
          <>
            <div className="form-group">
              <label htmlFor="experience">Experience (Years)</label>
              <input
                id="experience"
                name="experience"
                type="number"
                value={formData?.experience}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expertise">Expertise</label>
              <input
                id="expertise"
                name="expertise"
                type="text"
                value={formData?.expertise}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
            />
            <span style={{ marginInline: "5px" }}>Is Admin</span>
          </label>
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span style={{ marginInline: "5px" }}>Is Active</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit">{isEditMode ? "Update User" : "Create User"}</button>
      </div>
    </form>
  );
};

export default UserForm;
