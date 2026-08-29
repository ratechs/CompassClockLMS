import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaBriefcase,
  FaUniversity,
  FaCamera,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthcontext } from "../../contexts/Authcontext";

const StudentProfile = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthcontext();
  console.log("The auth user", authUser)
  const user = authUser?.user

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    phoneNumber: "",
    profilePicture: "",
    educationLevel: "",
    schoolClass: "",
    collegeDegree: "",
    customCollegeDegree: "",
    experience: "",
    expertise: "",
    institution: "",
    otherInstitution: "",
  });

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Load existing user information
   */
  useEffect(() => {
    if (!user) return;

    setFormData({
      fullname: user.fullname || "",
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      profilePicture: user.profilePicture || "",
      educationLevel: user.educationLevel || "",
      schoolClass: user.schoolClass || "",
      collegeDegree: user.collegeDegree || "",
      customCollegeDegree: user.customCollegeDegree || "",
      experience: user.experience ?? "",
      expertise: user.expertise || "",
      institution: user.institution?._id || user.institution || "",
      otherInstitution: user.otherInstitution || "",
    });

    if (user.profilePicture) {
      setPreview(user.profilePicture);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be less than 5MB.");
      return;
    }

    setError("");

    const imageUrl = URL.createObjectURL(file);

    setPreview(imageUrl);

    setFormData((prev) => ({
      ...prev,
      profilePicture: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          data.append(key, value);
        }
      });

      /*
       * Replace this URL with your actual API endpoint
       */
      const response = await fetch(
        `api/users/${user._id}`,
        {
          method: "PUT",
          credentials: "include",
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile.");
      }

      setMessage("Profile updated successfully.");

      /*
       * If your application stores user information
       * in context/localStorage, update it here.
       */
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  const isStudent = user.role === "student";

  const isTeacher =
    user.role === "teacher" ||
    user.role === "instructor";

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-page__header">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <span className="profile-page__eyebrow">
            Account Settings
          </span>

          <h1>My Profile</h1>

          <p>
            Keep your personal and learning information up to date.
          </p>
        </div>
      </div>

      <form
        className="profile-form"
        onSubmit={handleSubmit}
      >

        {/* Profile Hero */}
        <section className="profile-card profile-card--hero">

          <div className="profile-avatar-wrapper">

            <div className="profile-avatar">

              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                />
              ) : (
                <FaUser />
              )}

            </div>

            <label
              htmlFor="profilePicture"
              className="avatar-upload"
            >
              <FaCamera />

              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>

          </div>

          <div className="profile-identity">

            <h2>
              {formData.fullname || "Your Name"}
            </h2>

            <p>
              @{formData.username || "username"}
            </p>

            <span className="role-badge">
              {user.role}
            </span>

          </div>

        </section>

        {/* Messages */}
        {message && (
          <div className="form-message form-message--success">
            {message}
          </div>
        )}

        {error && (
          <div className="form-message form-message--error">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <section className="profile-card">

          <div className="section-heading">

            <div className="section-icon">
              <FaUser />
            </div>

            <div>
              <h3>Personal Information</h3>

              <p>
                Update your basic account information.
              </p>
            </div>

          </div>

          <div className="form-grid">

            <div className="form-group">

              <label htmlFor="fullname">
                Full Name
              </label>

              <div className="input-wrapper">
                <FaUser />

                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

            </div>

            <div className="form-group">

              <label htmlFor="username">
                Username
              </label>

              <div className="input-wrapper">
                <FaUser />

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </div>

            </div>

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">
                <FaEnvelope />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                />
              </div>

            </div>

            <div className="form-group">

              <label htmlFor="phoneNumber">
                Phone Number
              </label>

              <div className="input-wrapper">
                <FaPhone />

                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

            </div>

          </div>

        </section>

        {/* Education */}
        {isStudent && (
          <section className="profile-card">

            <div className="section-heading">

              <div className="section-icon">
                <FaGraduationCap />
              </div>

              <div>
                <h3>Education</h3>

                <p>
                  Tell us about your current education.
                </p>
              </div>

            </div>

            <div className="form-grid">

              <div className="form-group">

                <label htmlFor="educationLevel">
                  Education Level
                </label>

                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                >
                  <option value="">
                    Select education level
                  </option>

                  <option value="school">
                    School
                  </option>

                  <option value="higher_secondary">
                    Higher Secondary
                  </option>

                  <option value="college">
                    College
                  </option>

                  <option value="university">
                    University
                  </option>

                  <option value="professional">
                    Professional
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label htmlFor="schoolClass">
                  Class / Grade
                </label>

                <input
                  id="schoolClass"
                  name="schoolClass"
                  type="text"
                  value={formData.schoolClass}
                  onChange={handleChange}
                  placeholder="Example: 10th, 12th"
                />

              </div>

              <div className="form-group">

                <label htmlFor="collegeDegree">
                  College Degree
                </label>

                <select
                  id="collegeDegree"
                  name="collegeDegree"
                  value={formData.collegeDegree}
                  onChange={handleChange}
                >
                  <option value="">
                    Select degree
                  </option>

                  <option value="BCA">
                    BCA
                  </option>

                  <option value="BSc">
                    B.Sc
                  </option>

                  <option value="BCom">
                    B.Com
                  </option>

                  <option value="BE">
                    B.E
                  </option>

                  <option value="BTech">
                    B.Tech
                  </option>

                  <option value="BA">
                    B.A
                  </option>

                  <option value="MA">
                    M.A
                  </option>

                  <option value="MCA">
                    MCA
                  </option>

                  <option value="MSc">
                    M.Sc
                  </option>

                  <option value="MTech">
                    M.Tech
                  </option>

                  <option value="other">
                    Other
                  </option>

                </select>

              </div>

              {formData.collegeDegree === "other" && (
                <div className="form-group">

                  <label htmlFor="customCollegeDegree">
                    Specify Degree
                  </label>

                  <input
                    id="customCollegeDegree"
                    name="customCollegeDegree"
                    type="text"
                    value={formData.customCollegeDegree}
                    onChange={handleChange}
                    placeholder="Enter your degree"
                  />

                </div>
              )}

            </div>

          </section>
        )}

        {/* Teacher Information */}
        {isTeacher && (
          <section className="profile-card">

            <div className="section-heading">

              <div className="section-icon">
                <FaBriefcase />
              </div>

              <div>
                <h3>Teaching Information</h3>

                <p>
                  Update your teaching experience and expertise.
                </p>
              </div>

            </div>

            <div className="form-grid">

              <div className="form-group">

                <label htmlFor="experience">
                  Experience
                </label>

                <div className="input-with-suffix">

                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="0"
                  />

                  <span>
                    Years
                  </span>

                </div>

              </div>

              <div className="form-group form-group--full">

                <label htmlFor="expertise">
                  Area of Expertise
                </label>

                <textarea
                  id="expertise"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  placeholder="Example: Mathematics, React, Python, Science..."
                  rows="4"
                />

              </div>

            </div>

          </section>
        )}

        {/* Institution */}
        <section className="profile-card">

          <div className="section-heading">

            <div className="section-icon">
              <FaUniversity />
            </div>

            <div>
              <h3>Institution</h3>

              <p>
                Add your school, college or organization.
              </p>
            </div>

          </div>

          <div className="form-grid">

            <div className="form-group">

              <label htmlFor="institution">
                Institution
              </label>

              <select
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
              >
                <option value="">
                  Select institution
                </option>

                {/* 
                  Replace these with institutions
                  fetched from your API.
                */}

                <option value="other">
                  Other
                </option>

              </select>

            </div>

            {formData.institution === "other" && (
              <div className="form-group">

                <label htmlFor="otherInstitution">
                  Institution Name
                </label>

                <input
                  id="otherInstitution"
                  name="otherInstitution"
                  type="text"
                  value={formData.otherInstitution}
                  onChange={handleChange}
                  placeholder="Enter institution name"
                />

              </div>
            )}

          </div>

        </section>

        {/* Actions */}
        <div className="profile-actions">

          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-button"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="spinner" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Changes
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
};

export default StudentProfile;