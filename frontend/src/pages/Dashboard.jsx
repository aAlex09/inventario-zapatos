import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { getUserFuncionalidadesActivas } from "../api/funcionalidades";
import "../App.css";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [funcionalidades, setFuncionalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const cedula = decoded.cedula;
      setUserData(decoded);

      if (cedula) {
        getUserFuncionalidadesActivas(cedula)
          .then(data => {
            console.log("Funcionalidades activas (dashboard):", data);
            setFuncionalidades(data); // ← DEBE contener solo las activas
            setLoading(false);
          })
          .catch(err => {
            console.error("Error al obtener funcionalidades activas:", err);
            setLoading(false);
          });
      }
    } else {
      navigate("/");
    }
  }, []);

  const tieneFuncionalidad = (nombreFuncion) => {
    // Usar Set para eliminar duplicados antes de la comparación
    const funcionesUnicas = new Set(funcionalidades.map(f => f.nombre));
    return funcionesUnicas.has(nombreFuncion);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const menusDisponibles = [
    { nombre: "Usuarios", path: "/users", funcionalidad: "Usuarios", icono: "👤" },
    { nombre: "Inventario", path: "/inventario", funcionalidad: "Inventario", icono: "👟" },
    { nombre: "Reportes", path: "/reportes", funcionalidad: "Reportes", icono: "📊" },
    { nombre: "Configuración", path: "/configuracion", funcionalidad: "Configuración", icono: "⚙️" },
    { nombre: "Ventas", path: "/ventas", funcionalidad: "Ventas", icono: "🛒" },
    { nombre: "Productos", path: "/productos", funcionalidad: "Productos", icono: "📦" },
    { nombre: "Clientes", path: "/clientes", funcionalidad: "Clientes", icono: "👥" },
    { nombre: "Stock", path: "/stock", funcionalidad: "Stock", icono: "📦" }
  ];

  if (loading) {
    return <div className="loading">Cargando el Dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="logo-section">
          <img
            src="https://cdn3.iconfinder.com/data/icons/other-icons/48/nike_shoes-1024.png"
            alt="Logo"
            className="dashboard-logo"
          />
          <h1>Inventario de Zapatos</h1>
        </div>

        <div className="user-section">
          <span className="user-email">{userData?.sub}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Bienvenido</h2>
          <p>Selecciona una opción para comenzar</p>
        </div>

        <div className="menu-section">
          {menusDisponibles.filter(item => tieneFuncionalidad(item.funcionalidad)).length > 0 ? (
            <div className="dashboard-menu">
              {menusDisponibles
                .filter(item => tieneFuncionalidad(item.funcionalidad))
                .map(item => (
                  <div
                    key={item.nombre}
                    className="menu-item"
                    onClick={() => handleMenuClick(item.path)}
                  >
                    <div className="menu-icon">{item.icono}</div>
                    <span>{item.nombre}</span>
                    {/* Aquí irá la funcionalidad futura */}
                  </div>
                ))}
            </div>
          ) : (
            <p className="no-access-message">
              No tienes funcionalidades activas asignadas. Contacta al administrador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
