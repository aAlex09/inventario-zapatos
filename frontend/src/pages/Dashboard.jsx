import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUserFunctionalities } from '../api/funcionalidades';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [userFunctionalities, setUserFunctionalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [showWorkingModal, setShowWorkingModal] = useState(false);
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

  // Mapeo actualizado con 10 funcionalidades
  const functionalityRouteMap = {
    "Usuarios": { route: "/users", icon: "👥", color: "blue" },
    "Inventario": { route: "/inventario", icon: "📦", color: "green" },
    "Bodega": { route: "/bodega", icon: "🏭", color: "purple" },
    "Movimientos": { route: "/movimientos", icon: "🔄", color: "orange" },
    "Ventas": { route: "/sales", icon: "💰", color: "red" },
    "Reportes": { route: "/reports", icon: "📊", color: "teal" },
    "Configuracion": { route: "/settings", icon: "⚙️", color: "gray" },
    "Clientes": { route: "/clients", icon: "🧑‍🤝‍🧑", color: "pink" },
    "Proveedores": { route: "/suppliers", icon: "🏭", color: "indigo" },
    "Facturacion": { route: "/facturacion", icon: "🧾", color: "cyan" }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cedula = localStorage.getItem('userCedula');
    
    if (!token) {
      handleLogout();
      return;
    }
    
    try {
      const decodedToken = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        handleLogout();
        return;
      }
      
      // Obtener el rol del usuario
      const rolName = decodedToken.rol || 'Usuario';
      
      setUserData({
        ...decodedToken,
        cedula: cedula || decodedToken.cedula,
        nombre: decodedToken.nombre || decodedToken.sub,
        tipo_usuario: decodedToken.role,
        email: decodedToken.email
      });

      // Cargar las funcionalidades del usuario
      const fetchFunctionalities = async () => {
        try {
          const userCedula = cedula || decodedToken.cedula;
          const functionalities = await getUserFunctionalities(userCedula);
          setUserFunctionalities(functionalities);
        } catch (error) {
          console.error("Error fetching functionalities:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchFunctionalities();
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
    // Lista de rutas implementadas
    const implementedRoutes = [
      '/dashboard',
      '/users',
      '/inventario',
      '/bodega',
      '/movimientos',
      '/reports',
      '/facturacion'
    ];
    
    if (!implementedRoutes.includes(path)) {
      setShowWorkingModal(true);
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      if (token) {
        const decodedToken = jwtDecode(token);
        
        if (decodedToken.exp * 1000 < Date.now()) {
          handleLogout();
          return;
        }
      } else {
        handleLogout();
        return;
      }
      
      navigate(path);
    } catch (error) {
      console.error("Error en navegación:", error);
      handleLogout();
    }
  }, [navigate, handleLogout]);

  if (loading || !userData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-logo">
          <img 
            src="https://cdn3.iconfinder.com/data/icons/other-icons/48/nike_shoes-1024.png" 
            alt="Logo Inventario de Zapatos" 
          />
          <h1>Inventario de Zapatos</h1>
        </div>
        <div className="user-info">
          <span>¡Bienvenido, {userData.sub}!</span>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="user-profile">
          <div className="profile-avatar">
            {(userData.nombre ? userData.nombre.charAt(0) : userData.sub.charAt(0)).toUpperCase()}
          </div>
          <div className="user-details">
            <p>
              <span className="detail-label">Nombre:</span> 
              {userData.nombre || userData.sub}
            </p>
            <p>
              <span className="detail-label">Cédula:</span> 
              {userData.cedula}
            </p>
              
            <p>
              <span className="detail-label">Correo:</span> 
              {userData.email || userData.sub}
            </p>
          </div>
        </section>

        <div className="functionalities-section">
          <h2 className="functionalities-title">Funcionalidades</h2>
          <section className="functionalities-grid">
            {userFunctionalities.map(func => {
              const routeInfo = functionalityRouteMap[func.nombre];
              if (!routeInfo) return null;

              return (
                <div 
                  key={func.id_funcionalidad}
                  className={`functionality-card ${routeInfo.color} ${activeCard === routeInfo.route ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCard(routeInfo.route);
                    handleNavigation(routeInfo.route);
                  }}
                  onMouseEnter={() => setActiveCard(routeInfo.route)}
                  onMouseLeave={() => setActiveCard(null)}
                >
                  <div className="card-icon">{routeInfo.icon}</div>
                  <h3>{func.nombre}</h3>
                </div>
              );
            })}
          </section>
        </div>
      </main>

      {/* Modal de "En construcción" */}
      {showWorkingModal && (
        <div className="modal-backdrop" onClick={() => setShowWorkingModal(false)}>
          <div className="working-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <h2>🚧✋🚧</h2>
              <p>Estamos trabajando en este módulo</p>
              <p className="coming-soon">¡Próximamente!</p>
              <button className="close-modal-btn" onClick={() => setShowWorkingModal(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
