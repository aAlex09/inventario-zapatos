import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { resetPassword, validateResetToken } from "../api/auth";
import "../styles/Auth.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();
  
  // Validar el token al cargar el componente
  useEffect(() => {
    const checkToken = async () => {
      try {
        await validateResetToken(token);
        setTokenValid(true);
      } catch (err) {
        setError("El enlace de recuperación no es válido o ha expirado.");
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };
    
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    // Verificar la fortaleza de la contraseña
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "No se pudo restablecer la contraseña. Por favor intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Mostrar un indicador de carga mientras se valida el token
  if (validatingToken) {
    return (
      <div className="login-page dark-mode">
        <div className="loading">Validando enlace de recuperación...</div>
      </div>
    );
  }

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
            <h1>Restablecer Contraseña</h1>
            {!success && tokenValid && (
              <p>Ingrese su nueva contraseña</p>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {!tokenValid && !error && (
            <div className="error-message">
              El enlace de recuperación no es válido o ha expirado.
            </div>
          )}
          
          {success ? (
            <div className="reset-success">
              <div className="success-icon">✓</div>
              <p>Su contraseña ha sido restablecida exitosamente.</p>
              <p className="small-text">Será redirigido al inicio de sesión en unos segundos...</p>
              <Link to="/" className="auth-button return-button">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : tokenValid && (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="password">Nueva Contraseña</label>
                <input 
                  type="password" 
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su nueva contraseña" 
                  required 
                />
                <small className="password-hint">La contraseña debe tener al menos 8 caracteres.</small>
              </div>
              
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme su nueva contraseña" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? "Restableciendo..." : "Restablecer Contraseña"}
              </button>
              
              <div className="auth-links">
                <Link to="/" className="back-link">
                  <span className="arrow">←</span> Volver al inicio de sesión
                </Link>
              </div>
            </form>
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