import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Login.css";
import { FaUser, FaLock, FaLeaf } from "react-icons/fa";
import logo from "../assets/logo.png";

function Login() {
  const navigate = useNavigate();
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    navigate("/app");
  }
}, []);

  const handleLogin = async (e) => {
  e.preventDefault();

  const email = e.target[0].value;
  const password = e.target[1].value;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data);
      return;
    }

    // 🔐 STORE TOKEN
    localStorage.setItem("token", data.token);

    // optional: store user
    localStorage.setItem("user", JSON.stringify(data));

    navigate("/app");

  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
};

  return (
    <div className="login-page">
      <div className="login-card">

       <div className="brand">
  <img src={logo} alt="Virudhi" className="brand-logo" />

  <div className="brand-text">
    <h2 className="brand-title">Virudhi</h2>
    <p className="brand-tagline">
       Nature's Way of Healing
    </p>
  </div>
</div>
        <h1>Welcome Back!</h1>
        <p className="subtitle">Please login to your account.</p>

        <form onSubmit={handleLogin}>
          <div className="input-box">
            <FaUser />
            <input type="email" placeholder="Email Address" required />
          </div>

          <div className="input-box">
            <FaLock />
            <input type="password" placeholder="Password" required />
          </div>

          <div className="options">
            <label>
              <input type="checkbox" /> Remember Me
            </label>
            <span onClick={() => navigate("/forgot-password")} className="link">
  Forgot Password?
</span>
          </div>

          <button className="btn" type="submit">Login</button>

          <p className="bottom-text">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")} className="link">
  Sign Up
</span>
          </p>
        </form>

      </div>
    </div>
  );
}

export default Login;