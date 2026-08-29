import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../hooks/uselogin";
import logo from "../assets/images/logos/logo-dark.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lastLogin, setLastLogin] = useState(null);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Get current date and time at the moment of login
    const loginDateTime = new Date();

    // Store it in state
    setLastLogin(loginDateTime);

    // ISO format is recommended for sending to backend
    const lastLoginTime = loginDateTime.toISOString();

    console.log("Last Login:", lastLoginTime);

    try {
      await login(username, password, lastLogin);
    } catch (err) {
      setError(
        err.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="login-page-wrapper">

      {/* Animated Background */}
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <div className="login-container-modern">

        <div className="login-card-modern">

          <div className="card-glow-effect"></div>
          <div className="card-top-stripe"></div>

          <div className="card-content-modern">

            {/* Header */}
            <div className="login-header-modern">

              <img
                src={logo}
                alt="HSAGS Logo"
                className="logo-image-modern"
              />

              <p>
                Sign in to continue your learning journey
              </p>

            </div>

            {/* Error Alert */}
            {error && (
              <div className="alert-error-modern">

                <span className="alert-icon">
                  ⚠️
                </span>

                {error}

                <button
                  type="button"
                  className="alert-close-modern"
                  onClick={() => setError(null)}
                  aria-label="Close alert"
                >
                  ✕
                </button>

              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="login-form-modern"
            >

              {/* Username */}
              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#EE017E"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                </div>

                <input
                  type="text"
                  id="username"
                  className="input-field-modern"
                  placeholder="Username or Email"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  required
                  autoFocus
                />

                <div className="input-line-modern"></div>

              </div>

              {/* Password */}
              <div className="input-group-modern">

                <div className="input-icon-wrapper-modern">

                  <svg
                    className="input-icon-svg"
                    viewBox="0 0 24 24"
                    fill="#EE017E"
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
                  id="password"
                  className="input-field-modern"
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
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
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
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

              {/* Login */}
              <button
                type="submit"
                className="btn-login-modern btn-primary"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="spinner-modern"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Login

                    <svg
                      className="btn-arrow-modern"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}

              </button>

              {/* Signup */}
              <div className="signup-link-modern">

                <p>
                  Don't have an account?{" "}
                  <Link to="/signup">
                    Create one
                  </Link>
                </p>

              </div>

            </form>

            {/* Optional: Show generated login time */}
            {lastLogin && (
              <div
                style={{
                  marginTop: "15px",
                  fontSize: "12px",
                  color: "#777",
                  textAlign: "center",
                }}
              >
                Login time:{" "}
                {lastLogin.toLocaleString("en-IN")}
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="login-footer-modern">

          <p>
            © 2026 Beternal. All rights reserved.
          </p>

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

export default Login;