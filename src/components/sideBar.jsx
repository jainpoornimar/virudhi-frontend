import {
  FiHome,
  FiGrid,
  FiHeart,
  FiFileText,
  FiMessageCircle,
  FiLogOut,
  FiCompass,
  FiActivity,
} from "react-icons/fi";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import "./sidebar.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const DEFAULT_PLANT_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="100%" height="100%" fill="#e8f5e9"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="18" fill="#2e7d32">
        Plant
      </text>
    </svg>
  `);

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [plants, setPlants] = useState([]);
  const [loadingPlant, setLoadingPlant] = useState(true);

  const token = localStorage.getItem("token");

  const isHomeActive =
    location.pathname === "/app" || location.pathname === "/app/home";

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setLoadingPlant(true);

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/plants`, {
        method: "GET",
        headers,
      });

      if (!res.ok) throw new Error("Failed to fetch plants");

      const data = await res.json();
      setPlants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Plant fetch error:", err);
      setPlants([]);
    } finally {
      setLoadingPlant(false);
    }
  };

  const plantOfTheDay = useMemo(() => {
    if (!plants.length) return null;

    const today = new Date();
    const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = (hash * 31 + dateKey.charCodeAt(i)) % plants.length;
    }

    return plants[hash];
  }, [plants]);

  const plantImage = useMemo(() => {
    if (!plantOfTheDay) return DEFAULT_PLANT_IMG;

    if (
      Array.isArray(plantOfTheDay.images) &&
      plantOfTheDay.images.length > 0 &&
      plantOfTheDay.images[0]
    ) {
      return plantOfTheDay.images[0];
    }

    return DEFAULT_PLANT_IMG;
  }, [plantOfTheDay]);

  const shortDescription = useMemo(() => {
    if (!plantOfTheDay?.description) {
      return "Discover today’s featured healing plant.";
    }

    return plantOfTheDay.description.length > 90
      ? `${plantOfTheDay.description.slice(0, 90)}...`
      : plantOfTheDay.description;
  }, [plantOfTheDay]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="top">
        <div
          className="logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
          }}
        >
          <img
            src={logo}
            alt="Virudhi"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #c8e6c9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.3px",
              }}
            >
              Virudhi
            </span>

            <span
              style={{
                fontSize: "12px",
                color: "#fff",
                fontStyle: "italic",
                marginTop: "2px",
                textWrap: "nowrap",
              }}
            >
              Nature's Way of Healing
            </span>
          </div>

          
        </div>

        

        <ul className="menu">
          <li
            className={isHomeActive ? "active" : ""}
            onClick={() => navigate("/app")}
          >
            <FiHome className="icon" />
            <span>Home</span>
          </li>

          <NavLink to="/app/dashboard" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiGrid className="icon" />
                <span>Dashboard</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/app/favorites" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiHeart className="icon" />
                <span>Favorites</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/app/notes" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiFileText className="icon" />
                <span>My Notes</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/app/explore" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiCompass className="icon" />
                <span>Discover</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/app/remedies" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiActivity className="icon" />
                <span>Heal Naturally</span>
              </li>
            )}
          </NavLink>

          <NavLink to="/app/ask-nature" className="menu-link">
            {({ isActive }) => (
              <li className={isActive ? "active" : ""}>
                <FiMessageCircle className="icon" />
                <span>Ask Nature</span>
              </li>
            )}
          </NavLink>
        </ul>
      </div>

      <div className="middle">
        <div className="plant-card">
          <p className="small big-title">Plant of the Day</p>

          {loadingPlant ? (
            <>
              <div className="plant-placeholder">Loading...</div>
              <h4>Loading plant...</h4>
              <p className="desc">Finding today’s featured plant.</p>
              <button disabled>Explore</button>
            </>
          ) : plantOfTheDay ? (
            <>
              <img
                src={plantImage}
                alt={plantOfTheDay.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_PLANT_IMG;
                }}
              />
              <h4>{plantOfTheDay.name}</h4>
              <p className="desc">{shortDescription}</p>
              <button onClick={() => navigate(`/app/plant/${plantOfTheDay.id}`)}>
                Explore
              </button>
            </>
          ) : (
            <>
              <div className="plant-placeholder">No Plant</div>
              <h4>No plant found</h4>
              <p className="desc">Unable to load today’s featured plant.</p>
              <button onClick={() => navigate("/app/explore")}>Explore</button>
            </>
          )}
        </div>
      </div>

      <div className="bottom">
        <div className="logout" onClick={handleLogout}>
          <FiLogOut className="icon" />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
}