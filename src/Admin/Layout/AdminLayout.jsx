import AdminSidebar from "../Components/AdminSidebar";
import AdminNavbar from "../Components/Adminnavbar";
import { Outlet } from "react-router-dom";
import forestBg from "../../assets/bgimage.png";

const AdminLayout = () => {
  
  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundImage: `url(${forestBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "rgba(0, 9, 5, 0.45)",
        }}
      />

      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 h-full w-[260px] z-20"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <AdminSidebar />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 ml-[260px] flex flex-col h-screen relative z-10">

        {/* Navbar */}
        <div
          style={{
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <AdminNavbar />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;