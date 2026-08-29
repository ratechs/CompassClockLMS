// components/Logo.jsx
import { Link } from "react-router-dom";
import site_config from "../config/site.config";
import logo from "../assets/images/logos/logo.png";
const Logo = ({ variant = "full", showTagline = true }) => {
  return (
    <Link to="/" className="logo-link">
      <div className="logo-container">
        {/* Logo Image */}
        <img src={logo} alt="HSAGS Logo" className="logo-image" />
      </div>
    </Link>
  );
};

export default Logo;