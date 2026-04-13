import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import bg from "../../assets/loginNew.png";
import logo from "../../assets/logo.png";

const AdminLogin = () => {
  const navigate = useNavigate();

  // 🔐 Auto redirect if already admin
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role === "Admin") {
    navigate("/admin");
  }
}, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      // ❌ Backend error handling FIXED
      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ❌ Block non-admin
      if (data.role !== "Admin") {
        alert("Access denied: Not an admin");
        return;
      }

      // ✅ Store auth
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      navigate("/admin");

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-lg w-[350px] text-white">
<div className="brand">
  <img src={logo} alt="Virudhi" className="brand-logo" />

  <div className="brand-text">
    <h2 className="brand-title">Virudhi</h2>
    <p className="brand-tagline">
       Nature's Way of Healing
    </p>
  </div>
</div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          🌿 Admin Login
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="Admin Email"
            required
            className="p-3 rounded-lg bg-white/20 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="p-3 rounded-lg bg-white/20 outline-none"
          />

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 p-3 rounded-lg font-semibold"
          >
            Login
          </button>

        </form>

      </div>
    </div>
  );
};

export default AdminLogin;