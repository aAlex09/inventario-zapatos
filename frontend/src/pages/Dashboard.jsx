import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserFunctionalitiesList from '../components/UserFunctionalitiesList';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación al cargar
    const token = localStorage.getItem('token');
    const cedula = localStorage.getItem('userCedula');
    
    if (!token) {
      navigate('/');
      return;
    }
    
    try {
      const decodedToken = jwtDecode(token);
      setUserData({
        ...decodedToken,
        cedula: cedula || decodedToken.cedula
      });
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem('token');
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userCedula');
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (!userData) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Panel de Control</h1>
        <div className="user-info">
          <span>¡Bienvenido!</span>
          <button className="logout-button" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <h2>Menú Principal</h2>
          <nav className="dashboard-nav">
            <button onClick={() => handleNavigation('/dashboard')}>Inicio</button>
            <button onClick={() => handleNavigation('/users')}>Usuarios</button>
            <button onClick={() => handleNavigation('/inventario')}>Inventario</button>
            <button onClick={() => handleNavigation('/sales')}>Ventas</button>
            <button onClick={() => handleNavigation('/reports')}>Reportes</button>
            <button onClick={() => handleNavigation('/settings')}>Configuración</button>
          </nav>
        </div>

        <div className="dashboard-main">
          <div className="welcome-section">
            <h2>Resumen</h2>
            <p>Cédula: {userData.cedula}</p>
          </div>

          {/* User Functionalities Section */}
          <div className="functionalities-section">
            <UserFunctionalitiesList cedula={userData.cedula} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
