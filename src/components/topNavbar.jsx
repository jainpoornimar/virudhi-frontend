import { FiBell, FiSun, FiSearch } from "react-icons/fi";
import "./topnavbar.css";

const TopNavbar = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="topnav">

      {/* LEFT */}
      <div className="left">
        <h2>Welcome back, {name} 🌿</h2>
        <p>Here's your herbal journey update</p>
      </div>

      {/* CENTER */}
      {/* <div className="search-box">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search for plants, benefits..." />
      </div> */}

      {/* RIGHT */}
      {/* <div className="right">
        <FiBell className="nav-icon" />
        <FiSun className="nav-icon" /> */}

        <div className="profile">
          <div className="avatar">{initial}</div>
          <span>{name}</span>
        </div>
      </div>

    
  );
};

export default TopNavbar;