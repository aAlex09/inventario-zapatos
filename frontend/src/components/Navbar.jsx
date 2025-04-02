import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar({ userData }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-header">
      <div className="logo-section">
        <img
          src="https://cdn3.iconfinder.com/data/icons/other-icons/48/nike_shoes-1024.png"
          alt="Logo"
          className="dashboard-logo"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        />
        <h1 onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
          Inventario de Zapatos
        </h1>
      </div>

      <div className="user-section">
        <span className="user-email">{userData?.sub}</span>
        <Link to="/inventario" className="nav-link">Inventario</Link>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}