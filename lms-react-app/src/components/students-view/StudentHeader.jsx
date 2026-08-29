// components/student/StudentHeader.jsx
import React, { useState } from "react";
import {
  Navbar,
  Collapse,
  Nav,
  NavbarBrand,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
  NavLink,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../layouts/Logo";
import user1 from "../../assets/images/users/user4.jpg";
import useLogout from "../../hooks/uselogout";
import { useAuthcontext } from "../../contexts/Authcontext";

const StudentHeader = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout } = useLogout();
  const { authUser } = useAuthcontext();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleNavbar = () => setIsOpen((prev) => !prev);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Navigation items for non-authenticated users
  const navItems = [
    { label: "About", href: "#about" },
    { label: "Features", href: "#platforms" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Contact", href: "#final-cta" },
  ];
  const navItems1 = [
    { label: "Courses", href: "/courses" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#platforms" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Contact", href: "#final-cta" },
  ];

  return (
    <Navbar color="white" expand="md" className="fix-header py-2 shadow-sm" light>
      {/* Brand / Logo */}
      <NavbarBrand className="d-flex align-items-center">
        <Logo />
      </NavbarBrand>

      {/* Mobile Toggle Button */}
      <button
        className="navbar-toggler border-0"
        type="button"
        onClick={toggleNavbar}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      {/* Collapsible Content */}
      <Collapse isOpen={isOpen} navbar>
        {/* Center Navigation - Only for non-authenticated users */}
        {!authUser ? (
          <Nav className="mx-auto" navbar>
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                href={item.href}
                className="text-dark fw-semibold px-3"
                style={{ cursor: "pointer" }}
              >
                {item.label}
              </NavLink>
            ))}
          </Nav>
        ) : (
          <Nav className="mx-auto" navbar>
            {navItems1.map((item, index) => (
              <NavLink
                key={index}
                href={item.href}
                className="text-dark fw-semibold px-3"
                style={{ cursor: "pointer" }}
              >
                {item.label}
              </NavLink>
            ))}
          </Nav>
        )}

        {/* Right Side - User Actions */}
        <Nav className="ms-auto align-items-center" navbar>
          {authUser ? (
            // ====== AUTHENTICATED USER ======
            <>
            <Button
                color="primary"
                className="px-4 py-2 text-white fw-bold rounded-pill btn--primary mx-3"
                onClick={() => navigate("/login")}
              >
                Enroll Now
              </Button>
              <UncontrolledDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
              <DropdownToggle color="transparent" className="p-0 d-flex align-items-center gap-2 border-0">
                <img
                  src={authUser.user?.profilePicture || user1}
                  alt="Profile"
                  className="rounded-circle"
                  width="40"
                  height="40"
                  style={{ objectFit: "cover" }}
                />
                <span className="text-capitalize fw-semibold d-none d-sm-inline">
                  {authUser.user?.username || "User"}
                </span>
                <span className="caret d-none d-sm-inline">▼</span>
              </DropdownToggle>
              <DropdownMenu right style={{ marginTop: "8px", minWidth: "200px" }}>
                <DropdownItem header className="fw-bold text-muted">
                  {authUser.user?.username}
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={() => navigate("/profile")}>
                  👤 Profile
                </DropdownItem>
                <DropdownItem onClick={() => navigate("/dashboard")}>
                  📊 Dashboard
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={handleLogout} className="text-danger">
                  🚪 Logout
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
             
            </>
          ) : (
            // ====== NON-AUTHENTICATED USER ======
            <>
              <Button
                color="primary"
                className="px-4 py-2 text-white fw-bold rounded-pill btn--primary"
                onClick={() => navigate("/login")}
              >
                Login / Register
              </Button>
            </>
          )}
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default StudentHeader;