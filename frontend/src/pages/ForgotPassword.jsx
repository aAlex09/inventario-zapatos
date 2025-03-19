import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import "../styles/Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "No se pudo procesar su solicitud. Por favor intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page dark-mode">
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <img 
                src="https://cdn3.iconfinder.com/data/icons/other-icons/48/nike_shoes-1024.png" 
                alt="Logo Inventario de Zapatos"
              />
            </div>
            <h1>Recuperar Contraseña</h1>
            {!success ? (
              <p>Ingrese su correo electrónico para recuperar su contraseña</p>
            ) : (
              <p className="success-message">Hemos enviado un enlace de recuperación a su correo electrónico</p>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {!success ? (
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
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </button>
              
              <div className="auth-links">
                <Link to="/" className="back-link">
                  <span className="arrow">←</span> Volver al inicio de sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="reset-success">
              <div className="success-icon">✓</div>
              <p>Por favor revise su correo electrónico para obtener instrucciones sobre cómo restablecer su contraseña.</p>
              <p className="small-text">Si no recibe el correo en unos minutos, revise su carpeta de spam o correo no deseado.</p>
              <Link to="/" className="auth-button return-button">
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
        
        <div className="auth-image-container">
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