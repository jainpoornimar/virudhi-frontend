import { useNavigate } from "react-router-dom";
import "./login.css";
import { FaEnvelope, FaLeaf } from "react-icons/fa";

function ForgotPassword() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset link sent");

    alert("Password reset link sent to your email");
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* LOGO */}
        <div className="logo">
          <FaLeaf />
          <span>Herbal <b>Medical Care</b></span>
        </div>

        {/* TITLE */}
        <h1>Forgot Password</h1>
        <p className="subtitle">
          Enter your email to receive a reset link.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <FaEnvelope />
            <input type="email" placeholder="Email Address" required />
          </div>

          <button className="btn" type="submit">
            Send Reset Link
          </button>

          <p className="bottom-text">
            Remember your password?{" "}
            <span onClick={() => navigate("/")} className="link">
              Login
            </span>
          </p>
        </form>

      </div>
    </div>
  );
}

export default ForgotPassword;