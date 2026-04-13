import {
  FiHome,
  FiSettings,
  FiMap,
  FiMessageCircle,
  FiImage,
  FiLogOut,
} from "react-icons/fi";

import { NavLink, useNavigate } from "react-router-dom";
import "../../components/sideBar.css";

export default function AdminSidebar() {
  const navigate = useNavigate();

  // 🔐 LOGOUT FUNCTION
  const handleLogout = () => {
    // clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // redirect to admin login
    navigate("/admin/login");
  };

  return (
    <div className="sidebar">

      {/* TOP */}
      <div className="top">
        <div className="logo">
          🌿 <span>Admin Panel</span>
        </div>

        <ul className="menu">

          <NavLink to="/admin/dashboard" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiHome className="icon" />
                <span>Dashboard</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/admin/actions" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiSettings className="icon" />
                <span>Actions</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/admin/diseases" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiMap className="icon" />
                <span>Diseases</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/admin/chatbot" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiMessageCircle className="icon" />
                <span>Ask Nature</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/admin/media" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiImage className="icon" />
                <span>Media</span>
              </li>
            )}
          </NavLink>

        </ul>
      </div>

      {/* BOTTOM */}
      <div className="bottom">
        <div className="logout" onClick={handleLogout}>
          <FiLogOut className="icon" />
          <span>Logout</span>
        </div>
      </div>

    </div>
  );
}