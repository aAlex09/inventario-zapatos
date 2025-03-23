import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        
        if (token) {
            try {
                // Decode the JWT token to get user info
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (error) {
                console.error("Error decoding token:", error);
                localStorage.removeItem("token");
                navigate("/");
            }
        } else {
            navigate("/");
        }
        
        setLoading(false);
    }, [navigate]);

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Function to navigate to different pages
    const handleMenuClick = (path) => {
        navigate(path);
    };

    // Get role name based on role id
    const getRoleName = (roleId) => {
        switch (roleId) {
            case 1:
                return "Administrador";
            case 2:
                return "Vendedor";
            case 3:
                return "Bodeguero";
            default:
                return "Usuario";
        }
    };

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
                    <span className="user-role">{getRoleName(userData?.role)}</span>
                    <span className="user-email">{userData?.sub}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            
            <div className="dashboard-content">
                <div className="welcome-section">
                    <h2>Bienvenido al Sistema</h2>
                    <p>Selecciona una opción del menú para comenzar tu trabajo</p>
                </div>
                
                {userData && (
                    <div className="menu-section">
                        {userData.role === 1 && (
                            <>
                                <h3>Menú de Administrador</h3>
                                <div className="dashboard-menu">
                                    <div 
                                        className="menu-item"
                                        onClick={() => handleMenuClick("/users")}
                                    >
                                        <div className="menu-icon">👤</div>
                                        <span>Usuarios</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">👟</div>
                                        <span>Inventario</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">📊</div>
                                        <span>Reportes</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">⚙️</div>
                                        <span>Configuración</span>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {userData.role === 2 && (
                            <>
                                <h3>Menú de Vendedor</h3>
                                <div className="dashboard-menu">
                                    <div className="menu-item">
                                        <div className="menu-icon">🛒</div>
                                        <span>Ventas</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">👟</div>
                                        <span>Productos</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">👥</div>
                                        <span>Clientes</span>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {userData.role === 3 && (
                            <>
                                <h3>Menú de Bodeguero</h3>
                                <div className="dashboard-menu">
                                    <div className="menu-item">
                                        <div className="menu-icon">📦</div>
                                        <span>Stock</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">🚚</div>
                                        <span>Recepción</span>
                                    </div>
                                    <div className="menu-item">
                                        <div className="menu-icon">📋</div>
                                        <span>Pedidos</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                <div className="stats-section">
                    <h3>Resumen</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👟</div>
                            <div className="stat-details">
                                <span className="stat-title">Productos</span>
                                <span className="stat-value">120</span>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-details">
                                <span className="stat-title">Stock bajo</span>
                                <span className="stat-value">5</span>
                            </div>
                      
                        
                           
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
