import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await login(email, password);
      
      // Store cedula in localStorage for later use
      localStorage.setItem("userCedula", response.cedula);
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError("Credenciales inválidas. Por favor intente de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page dark-mode">
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <img 
                src="https://cdn3.iconfinder.com/data/icons/other-icons/48/nike_shoes-1024.png"
                alt="Logo Inventario de Zapatos"
              />
            </div>
            <h1>Inventario de Zapatos</h1>
            <p>Accede a tu cuenta</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com" 
                required 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
          
          <div className="login-footer">
            <Link to="/forgot-password" className="forgot-password secondary-button">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        
        <div className="login-image-container">
          <img 
            src="https://i.gifer.com/4KDr.gif"
            alt="Zapatos"
            className="side-image"
          />
        </div>
      </div>
    </div>
  );
}