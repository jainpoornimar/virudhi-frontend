import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./Admin/Components/AdminRoute";

// USER
import Login from "./Login/jsdghf";
import Register from "./Login/Register";
import ForgotPassword from "./Login/ForgotPassword";

import Home from "./pages/Home";
import PlantDetail from "./pages/PlantDetail";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import ExplorePage from "./pages/Explore";
import Notes from "./pages/Notes";
import AskNature from "./pages/AskNature";
import RemediesPage from "./pages/Remedies";
import RemedyDetail from "./pages/RemedyDetail";

// ADMIN
import AdminLogin from "./Admin/Layout/AdminLogin";
import AdminLayout from "./Admin/Layout/AdminLayout";
import AdminDashboard from "./Admin/Pages/Admindashboard";
import Actions from "./Admin/Pages/Action";
import AdminDiseases  from "./Admin/Pages/AdminDisease";
import AllDiseases from "./Admin/Pages/AllDisease";
import AllPlants from "./Admin/Pages/AllPlants";



function App() {

 
  

  return (
    <BrowserRouter>
      <Routes>

        {/* USER AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ADMIN AUTH */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* USER APP */}
        <Route
  path="/app"
  element={
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  }
>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="plant/:id" element={<PlantDetail />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="notes" element={<Notes />} />
          <Route path="ask-nature" element={<AskNature />} />
          <Route path="remedies" element={<RemediesPage />} />
          <Route path="remedy/:id" element={<RemedyDetail />} />
        </Route>

        {/* ADMIN PANEL */}
       <Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="actions" element={<Actions />} />
          <Route path="diseases" element={<AdminDiseases />} />
          <Route path="diseases/all" element={<AllDiseases />} />
         <Route path="actions/all" element={<AllPlants />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;