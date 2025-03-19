import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom"; // Add this import
import "../App.css";

export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Add this line

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
                // Handle invalid token - redirect to login
                localStorage.removeItem("token");
                navigate("/"); // Changed from window.location.href
            }
        } else {
            // No token found, redirect to login
            navigate("/"); // Changed from window.location.href
        }
        
        setLoading(false);
    }, [navigate]); // Add navigate to dependency array

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/"); // Changed from window.location.href
    };

    // Function to navigate to different pages based on menu item
    const handleMenuClick = (path) => {
        navigate(path);
    };

    // Different menu options based on role
    const renderRoleBasedMenu = () => {
        if (!userData) return null;
        
        switch (userData.role) {
            case 1: // Administrador
                return (
                    <div className="menu-section">
                        <h3>Menú de Administrador</h3>
                        <div className="dashboard-menu">
                            <div 
                                className="menu-item"
                                onClick={() => handleMenuClick("/users")} // Add this onClick handler
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
                    </div>
                );
            case 2: // Vendedor
                return (
                    <div className="menu-section">
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
                    </div>
                );
            case 3: // Bodeguero
                return (
                    <div className="menu-section">
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
                    </div>
                );
            default:
                return (
                    <div className="menu-section">
                        <h3>Menú de Usuario</h3>
                        <div className="dashboard-menu">
                            <div className="menu-item">
                                <div className="menu-icon">👤</div>
                                <span>Perfil</span>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    if (loading) {
        return <div className="loading">Cargando...</div>;
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
                    <h2>Bienvenido al Sistema</h2>
                    <p>Selecciona una opción del menú para comenzar</p>
                </div>
                
                {renderRoleBasedMenu()}
                
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
                            <div className="stat-icon">🛒</div>
                            <div className="stat-details">
                                <span className="stat-title">Ventas hoy</span>
                                <span className="stat-value">8</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-details">
                                <span className="stat-title">Stock bajo</span>
                                <span className="stat-value">5</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-details">
                                <span className="stat-title">Ingresos</span>
                                <span className="stat-value">$1,250</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
