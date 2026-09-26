import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useSignup from "../hooks/useSignup";

import logo from "../assets/images/logos/logo.png";

const SignUp = () => {
  const navigate = useNavigate();
  const { signup, loading } = useSignup();

  // ============================================================
  // FORM DATA
  // ============================================================

  const [inputs, setInputs] = useState({
    fullname: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "student",
    institution: "",
  });

  const [institutions, setInstitutions] = useState([]);
  const [institutionLoading, setInstitutionLoading] = useState(false);

  const [error, setError] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================================
  // FETCH INSTITUTIONS
  // ============================================================

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setInstitutionLoading(true);

        const res = await axios.get("/api/institutions");

        console.log("Institution API response:", res.data);

        // Supports:
        // { data: [...] }
        // or directly [...]
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setInstitutions(data);
      } catch (err) {
        console.error("Institution fetch error:", err);

        setError("Unable to load institutions. Please try again.");
      } finally {
        setInstitutionLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // HANDLE ROLE
  // ============================================================

  const handleRoleChange = (role) => {
    setInputs((prev) => ({
      ...prev,
      role,
      institution: "",
    }));

    setError(null);
  };

  // ============================================================
  // PASSWORD STRENGTH
  // ============================================================

  const getPasswordStrength = (password) => {
    if (!password) return "weak";

    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    ) {
      return "strong";
    }

    if (
      password.length >= 6 &&
      (/[A-Z]/.test(password) || /[0-9]/.test(password))
    ) {
      return "medium";
    }

    return "weak";
  };

  const getPasswordStrengthPercent = (password) => {
    const strength = getPasswordStrength(password);

    const levels = {
      weak: 33,
      medium: 66,
      strong: 100,
    };

    return levels[strength] || 0;
  };

  const getPasswordStrengthLabel = (password) => {
    const strength = getPasswordStrength(password);

    const labels = {
      weak: "Weak",
      medium: "Medium",
      strong: "Strong",
    };

    return labels[strength] || "";
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    // Password validation
    if (inputs.password !== inputs.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (inputs.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Institution required for student and teacher
    if (
      (inputs.role === "student" || inputs.role === "teacher") &&
      !inputs.institution
    ) {
      setError("Please select your institution.");
      return;
    }

    try {
      // ========================================================
      // PREPARE DATA
      // ========================================================

      const signupData = {
        fullname: inputs.fullname,
        username: inputs.username,
        email: inputs.email,
        phoneNumber: inputs.phoneNumber,
        password: inputs.password,
        confirmPassword: inputs.confirmPassword,
        role: inputs.role,
      };

      // Only send institution for student / teacher
      if (
        inputs.role === "student" ||
        inputs.role === "teacher"
      ) {
        signupData.institution = inputs.institution;
      }

      console.log("Signup data:", signupData);

      await signup(signupData);

      navigate("/login");

    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed. Please try again."
      );
    }
  };

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="login-page-wrapper">

      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="login-bg-shapes">

        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>

      </div>

      {/* ======================================================
          CONTAINER
      ====================================================== */}

      <div className="login-container-modern">

        <div className="login-card-modern">

          <div className="card-glow-effect"></div>

          <div className="card-top-stripe"></div>

          <div className="card-content-modern">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="login-header-modern">

              <div className="logo-wrapper-modern">

                <span className="logo-icon-modern">

                  <img
                    src={logo}
                    alt="Logo"
                    className="logo-image-modern"
                  />

                </span>

              </div>

              <h2 className="text-primary">
                Create Account
              </h2>

              <p>
                Join us and start your learning journey
              </p>

            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="alert-error-modern">

                <span className="alert-icon">
                  ⚠️
                </span>

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  className="alert-close-modern"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>

              </div>
            )}

            {/* ==================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="login-form-modern"
            >

              {/* ==================================================
                  ROLE
              ================================================== */}

              <div className="signup-role-section">

                <label className="signup-label">
                  Create account as
                </label>

                <div className="signup-role-grid">

                  {/* STUDENT */}

                  <button
                    type="button"
                    className={`signup-role-card ${
                      inputs.role === "student"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleRoleChange("student")
                    }
                  >

                    <div className="signup-role-icon">
                      <i className="bi bi-mortarboard-fill"></i>
                    </div>

                    <span>
                      Student
                    </span>

                  </button>

                  {/* TEACHER */}

                  <button
                    type="button"
                    className={`signup-role-card ${
                      inputs.role === "teacher"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleRoleChange("teacher")
                    }
                  >

                    <div className="signup-role-icon">
                      <i className="bi bi-person-workspace"></i>
                    </div>

                    <span>
                      Teacher
                    </span>

                  </button>

                  {/* INSTITUTION */}

                  {/* <button
                    type="button"
                    className={`signup-role-card ${
                      inputs.role === "institution"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleRoleChange("institution")
                    }
                  >

                    <div className="signup-role-icon">
                      <i className="bi bi-building"></i>
                    </div>

                    <span>
                      Institution
                    </span>

                  </button> */}

                </div>

              </div>

              {/* ==================================================
                  FULL NAME
              ================================================== */}

              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                </div>

                <input
                  type="text"
                  name="fullname"
                  id="fullname"
                  className="input-field-modern"
                  placeholder="Full name"
                  value={inputs.fullname}
                  onChange={handleChange}
                  required
                  autoFocus
                />

                <div className="input-line-modern"></div>

              </div>

              {/* ==================================================
                  USERNAME
              ================================================== */}

              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                </div>

                <input
                  type="text"
                  name="username"
                  id="username"
                  className="input-field-modern"
                  placeholder="Username"
                  value={inputs.username}
                  onChange={handleChange}
                  required
                />

                <div className="input-line-modern"></div>

              </div>

              {/* ==================================================
                  EMAIL
              ================================================== */}

              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>

                </div>

                <input
                  type="email"
                  name="email"
                  id="email"
                  className="input-field-modern"
                  placeholder="Email Address"
                  value={inputs.email}
                  onChange={handleChange}
                  required
                />

                <div className="input-line-modern"></div>

              </div>

              {/* ==================================================
                  PHONE
              ================================================== */}

              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>

                </div>

                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  className="input-field-modern"
                  placeholder="Phone Number"
                  value={inputs.phoneNumber}
                  onChange={handleChange}
                  required
                />

                <div className="input-line-modern"></div>

              </div>

              {/* ==================================================
                  INSTITUTION
              ================================================== */}

              {(inputs.role === "student" ||
                inputs.role === "teacher") && (

                <div className="input-group-modern">

                  <div className="input-icon-wrapper-modern">

                    <svg
                      className="input-icon-svg"
                      viewBox="0 0 24 24"
                      fill="#ff4aa5"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 21h18" />
                      <path d="M5 21V7l7-4 7 4v14" />
                      <path d="M9 21v-5h6v5" />
                      <path d="M9 9h.01" />
                      <path d="M12 9h.01" />
                      <path d="M15 9h.01" />
                      <path d="M9 12h.01" />
                      <path d="M12 12h.01" />
                      <path d="M15 12h.01" />
                    </svg>

                  </div>

                  <select
                    name="institution"
                    id="institution"
                    className="input-field-modern signup-institution-select"
                    value={inputs.institution}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      {institutionLoading
                        ? "Loading institutions..."
                        : "Select Institution"}
                    </option>

                    {!institutionLoading &&
                      institutions.map((institution) => (

                        <option
                          key={
                            institution._id ||
                            institution.id
                          }
                          value={
                            institution._id ||
                            institution.id
                          }
                        >
                          {institution.name}
                        </option>

                      ))}

                  </select>

                  <div className="input-line-modern"></div>

                </div>

              )}

              {/* ==================================================
                  INSTITUTION ACCOUNT MESSAGE
              ================================================== */}

              {inputs.role === "institution" && (

                <div className="signup-role-message">

                  <i className="bi bi-info-circle"></i>

                  <span>
                    Institution accounts are created and managed
                    separately. Please contact the administrator
                    to get institution access.
                  </span>

                </div>

              )}

              {/* ==================================================
                  PASSWORD
              ================================================== */}

              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    />

                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>

                </div>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  id="password"
                  className="input-field-modern"
                  placeholder="Password (min 6 characters)"
                  value={inputs.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle-modern"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  <svg
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />

                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />

                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                        />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </>
                    )}

                  </svg>

                </button>

                <div className="input-line-modern"></div>

              </div>

              {/* ==================================================
                  PASSWORD STRENGTH
              ================================================== */}

              {inputs.password && (

                <div className="password-strength-modern">

                  <div className="strength-bar">

                    <div
                      className={`strength-fill ${getPasswordStrength(
                        inputs.password
                      )}`}
                      style={{
                        width: `${getPasswordStrengthPercent(
                          inputs.password
                        )}%`,
                      }}
                    ></div>

                  </div>

                  <span className="strength-text">

                    Password strength:{" "}

                    {getPasswordStrengthLabel(
                      inputs.password
                    )}

                  </span>

                </div>

              )}

              {/* ==================================================
                  CONFIRM PASSWORD
              ================================================== */}

              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    />

                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />

                    <path d="M12 15v2" />
                  </svg>

                </div>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  id="confirmPassword"
                  className="input-field-modern"
                  placeholder="Confirm Password"
                  value={inputs.confirmPassword}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle-modern"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >

                  <svg
                    viewBox="0 0 24 24"
                    fill="#ff4aa5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    {showConfirmPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />

                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />

                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                        />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </>
                    )}

                  </svg>

                </button>

                <div className="input-line-modern"></div>

              </div>

              {/* ==================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                className="btn-login-modern"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="spinner-modern"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account

                    <svg
                      className="btn-arrow-modern"
                      viewBox="0 0 24 24"
                      fill="#ff4aa5"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}

              </button>

              {/* ==================================================
                  LOGIN
              ================================================== */}

              <div className="signin-link-modern">

                <p>

                  <span className="text-dark">
                    Already have an account?{" "}
                  </span>

                  <Link to="/login">
                    Sign In
                  </Link>

                </p>

              </div>

            </form>

          </div>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="login-footer-modern">

          <p>
            © 2026 HSAGS. All rights reserved.
          </p>

          <div className="footer-links-modern">

            <a href="#!">
              Privacy
            </a>

            <a href="#!">
              Terms
            </a>

            <a href="#!">
              Support
            </a>

          </div>

        </div>

      </div>

    </div>
  );
};

export default SignUp;