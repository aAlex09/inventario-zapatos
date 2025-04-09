import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserFunctionalitiesList from '../components/UserFunctionalitiesList';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para cerrar sesión
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userCedula');
    
    // Limpiar historial de navegación
    window.history.replaceState(null, '', '/');
    
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    // Verificar autenticación al cargar
    const token = localStorage.getItem('token');
    const cedula = localStorage.getItem('userCedula');
    
    if (!token) {
      handleLogout();
      return;
    }
    
    try {
      const decodedToken = jwtDecode(token);
      
      // Verificar expiración del token
      if (decodedToken.exp * 1000 < Date.now()) {
        handleLogout();
        return;
      }
      
      setUserData({
        ...decodedToken,
        cedula: cedula || decodedToken.cedula
      });
    } catch (error) {
      console.error("Error decoding token:", error);
      handleLogout();
      return;
    }

    // Configuración inicial del historial
    window.history.replaceState({ dashboardPathname: location.pathname }, '', location.pathname);

    // Manejar evento de navegación hacia atrás
    const handlePopState = (event) => {
      // Si no hay un estado específico o estamos saliendo del dashboard
      if (!event.state || !event.state.dashboardPathname) {
        handleLogout();
      }
    };

    // Manejar cierre de pestaña o navegador
    const handleBeforeUnload = (event) => {
      localStorage.removeItem('token');
      localStorage.removeItem('userCedula');
    };

    // Añadir listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Limpieza al desmontar
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate, location.pathname, handleLogout]);

  // Función de navegación segura
  const handleNavigation = useCallback((path) => {
    // Verificar que el token siga siendo válido antes de navegar
    const token = localStorage.getItem('token');
    
    try {
      if (token) {
        const decodedToken = jwtDecode(token);
        
        // Si el token ha expirado, cerrar sesión
        if (decodedToken.exp * 1000 < Date.now()) {
          handleLogout();
          return;
        }
      } else {
        handleLogout();
        return;
      }
      
      // Agregar estado al historial para la navegación
      window.history.pushState({ dashboardPathname: path }, '', path);
      navigate(path);
    } catch (error) {
      console.error("Error en navegación:", error);
      handleLogout();
    }
  }, [navigate, handleLogout]);

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
            <button onClick={() => handleNavigation('/bodega')}>Bodega</button>
            <button onClick={() => handleNavigation('/movimientos')}>Movimientos</button>
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
