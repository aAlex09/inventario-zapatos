import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const UserFunctionalitiesList = ({ cedula }) => {
  const [functionalities, setFunctionalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFunctionalities = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/users/${cedula}/funcionalidades`, // Changed from usuarios to users
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setFunctionalities(response.data);
        setError("");
      } catch (err) {
        console.error("Error fetching user functionalities:", err);
        setError("No se pudieron cargar las funcionalidades");
      } finally {
        setLoading(false);
      }
    };

    if (cedula) {
      fetchFunctionalities();
    }
  }, [cedula]);

  if (loading) return <p>Cargando funcionalidades...</p>;
  
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="user-functionalities">
      <h3>Mis Funcionalidades</h3>
      {functionalities.length === 0 ? (
        <p>No tienes funcionalidades asignadas</p>
      ) : (
        <div className="functionalities-grid">
          {functionalities.map(func => (
            <div className="functionality-card" key={func.id_funcionalidad}>
              <div className="functionality-icon">
                {func.nombre === "Administrar Usuarios" && "👥"}
                {func.nombre === "Gestionar Inventario" && "📦"}
                {func.nombre === "Realizar Ventas" && "💰"}
                {func.nombre === "Ver Reportes" && "📊"}
                {func.nombre === "Gestionar Proveedores" && "🏭"}
                {func.nombre === "Administrar Configuración" && "⚙️"}
              </div>
              <span>{func.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserFunctionalitiesList;