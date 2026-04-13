import "../../components/topNavbar.css";

const AdminNavbar = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.name || "Admin";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="topnav">
      <div className="left">
        <h2>Admin Dashboard 🌿</h2>
        <p>Manage your herbal platform</p>
      </div>

      <div className="right">
        <div className="profile">
          <div className="avatar">{initial}</div>
          <span>{name}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;