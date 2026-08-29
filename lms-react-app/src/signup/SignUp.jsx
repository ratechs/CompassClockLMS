// signup/SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSignup from "../hooks/useSignup";

// ====== IMPORT LOGO ======
import logo from "../assets/images/logos/logo.png"; // or logo.png

const SignUp = () => {
  const [inputs, setInputs] = useState({
    fullname: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, loading } = useSignup();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (inputs.password !== inputs.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (inputs.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await signup(inputs);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  // Password strength helpers
  const getPasswordStrength = (password) => {
    if (!password) return "weak";
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return "strong";
    }
    if (password.length >= 6 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
      return "medium";
    }
    return "weak";
  };

  const getPasswordStrengthPercent = (password) => {
    const strength = getPasswordStrength(password);
    const levels = { weak: 33, medium: 66, strong: 100 };
    return levels[strength] || 0;
  };

  const getPasswordStrengthLabel = (password) => {
    const strength = getPasswordStrength(password);
    const labels = { weak: "Weak", medium: "Medium", strong: "Strong" };
    return labels[strength] || "";
  };

  return (
    <div className="login-page-wrapper">
      {/* ====== ANIMATED BACKGROUND (SAME AS LOGIN) ====== */}
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* ====== SIGNUP CONTAINER ====== */}
      <div className="login-container-modern">
        <div className="login-card-modern">
          <div className="card-glow-effect"></div>
          <div className="card-top-stripe"></div>

          <div className="card-content-modern">
            {/* ====== HEADER ====== */}
            <div className="login-header-modern">
              <div className="logo-wrapper-modern">
                <span className="logo-icon-modern">
                  <img src={logo} alt="HSAGS Logo" className="logo-image-modern" />
                </span>
                <div className="logo-ring-modern"></div>
              </div>
              <h2>Create Account</h2>
              <p>Join us and start your learning journey</p>
            </div>

            {/* ====== ERROR ALERT ====== */}
            {error && (
              <div className="alert-error-modern">
                <span className="alert-icon">⚠️</span>
                {error}
                <button
                  type="button"
                  className="alert-close-modern"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ====== FORM ====== */}
            <form onSubmit={handleSubmit} className="login-form-modern">
              {/* Username */}
              <div className="input-group-modern">
                <div className="input-icon-wrapper-modern">
                  <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <div className="input-group-modern">
                <div className="input-icon-wrapper-modern">
                  <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  autoFocus
                />
                <div className="input-line-modern"></div>
              </div>

              {/* Email */}
              <div className="input-group-modern">
                <div className="input-icon-wrapper-modern">
                  <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

              {/* Phone Number */}
              <div className="input-group-modern">
                <div className="input-icon-wrapper-modern">
                  <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

              {/* Password */}
              <div className="input-group-modern">
                <div className="input-icon-wrapper-modern">
                  <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
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
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
                <div className="input-line-modern"></div>
              </div>

              {/* Confirm Password */}
              <div className="input-group-modern">
                <div className="input-icon-wrapper-modern">
                  <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <path d="M12 15v2" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showConfirmPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
                <div className="input-line-modern"></div>
              </div>

              {/* Password Strength */}
              {inputs.password && (
                <div className="password-strength-modern">
                  <div className="strength-bar">
                    <div 
                      className={`strength-fill ${getPasswordStrength(inputs.password)}`}
                      style={{ width: `${getPasswordStrengthPercent(inputs.password)}%` }}
                    ></div>
                  </div>
                  <span className="strength-text">
                    Password strength: {getPasswordStrengthLabel(inputs.password)}
                  </span>
                </div>
              )}

              {/* Submit Button - Using same class as login */}
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
                    <svg className="btn-arrow-modern" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="divider-modern">
                <span>or</span>
              </div>

              {/* Login Link */}
              <div className="signin-link-modern">
                <p>
                  Already have an account? <Link to="/login">Sign In</Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer - Same as login */}
        <div className="login-footer-modern">
          <p>© 2026 HSAGS. All rights reserved.</p>
          <div className="footer-links-modern">
            <a href="#!">Privacy</a>
            <a href="#!">Terms</a>
            <a href="#!">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;