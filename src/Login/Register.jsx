import { useNavigate } from "react-router-dom";
import "./login.css";
import { FaUser, FaLock, FaLeaf, FaEnvelope } from "react-icons/fa";
import logo from "../assets/logo.png";

function Register() {
  const navigate = useNavigate();

  const handleRegister = async (e) => {
  e.preventDefault();

  const name = e.target[0].value;
  const email = e.target[1].value;
  const password = e.target[2].value;
  const confirmPassword = e.target[3].value;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });
    console.log("API URL:", import.meta.env.VITE_API_URL);

    // 🔥 IMPORTANT: read as text first
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      console.error("Backend Error:", data);
      alert(JSON.stringify(data, null, 2)); // 👈 shows full error
      return;
    }

    alert("Registered successfully!");
    navigate("/");

  } catch (err) {
    console.error("Network Error:", err);
    alert(err.message); // 👈 shows real error
  }
};

  return (
    <div className="login-page">
      <div className="login-card">

        {/* LOGO */}
       <div className="brand">
         <img src={logo} alt="Virudhi" className="brand-logo" />
       
         <div className="brand-text">
           <h2 className="brand-title">Virudhi</h2>
           <p className="brand-tagline">
              Nature's Way of Healing
           </p>
         </div>
       </div>

        {/* TITLE */}
        <h1>Create Account</h1>
        <p className="subtitle">Join us for a healthier life.</p>

        {/* FORM */}
        <form onSubmit={handleRegister}>

          <div className="input-box">
            <FaUser />
            <input type="text" placeholder="Full Name" required />
          </div>

          <div className="input-box">
            <FaEnvelope />
            <input type="email" placeholder="Email Address" required />
          </div>

          <div className="input-box">
            <FaLock />
            <input type="password" placeholder="Password" required />
          </div>

          <div className="input-box">
            <FaLock />
            <input type="password" placeholder="Confirm Password" required />
          </div>

          <div className="options">
            <label>
              <input type="checkbox" required /> I agree to Terms
            </label>
          </div>

          <button className="btn" type="submit">Sign Up</button>

          <p className="bottom-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/")} className="link">
              Login
            </span>
          </p>

        </form>

      </div>
    </div>
  );
}

export default Register;