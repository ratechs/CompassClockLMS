import React from "react";
import { Link } from "react-router-dom";
import {
  Navbar,
  Collapse,
  Nav,
  NavItem,
  NavbarBrand,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Dropdown,
  Button,
} from "reactstrap";
import Logo from "./Logo";
import user1 from "../assets/images/users/user4.jpg";
import useLogout from "../hooks/uselogout";
import { useAuthcontext } from "../contexts/Authcontext";

const Header = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const { logout, loading } = useLogout();
  const { authUser } = useAuthcontext();
  console.log("authUser", authUser);

  const toggle = () => setDropdownOpen((prevState) => !prevState);
  const Handletoggle = () => {
    setIsOpen(!isOpen);
  };
  const showMobilemenu = () => {
    document.getElementById("sidebarArea").classList.add("showSidebar");
    document.addEventListener("mousedown", handleClickOutside);
  };

  const hideMobilemenu = () => {
    document.getElementById("sidebarArea").classList.remove("showSidebar");
    document.removeEventListener("mousedown", handleClickOutside);
  };

  const handleClickOutside = (event) => {
    const sidebar = document.getElementById("sidebarArea");
    if (sidebar && !sidebar.contains(event.target)) {
      hideMobilemenu();
    }
  };

  return (
    <Navbar color="white" dark expand="md" className="fix-header py-2">
      <div className="d-flex align-items-center justify-content-between w-100">
        <div className="d-lg-block d-block pe-3 site_name">
          <Logo className="h-75" />
        </div>
        
        <Button
          color="primary"
          className=" d-lg-none"
          onClick={() => showMobilemenu()}
        >

          <i className="bi bi-list"></i>
        </Button>
      </div>
      <div className="hstack gap-2 d-lg-block d-md-block d-none align-self-center">
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
          <DropdownToggle color="transparent">
            <img
              src={user1}
              alt="profile"
              className="rounded-circle"
              width="40"
            ></img>
            <span className="m-2 text-capitalize h6" > {authUser.user.username}</span>
            <i class="fa-solid fa-caret-down"></i>
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={logout}>Logout</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </Navbar>
  );
};

export default Header
