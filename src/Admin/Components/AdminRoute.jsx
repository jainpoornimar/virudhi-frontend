import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // ❌ not logged in
  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  // ❌ not admin
  if (user.role !== "Admin") {
    return <Navigate to="/" />;
  }

  // ✅ admin
  return children;
}

export default AdminRoute;