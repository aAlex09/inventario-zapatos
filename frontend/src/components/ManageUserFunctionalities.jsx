import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ManageUserFunctionalities = ({ user, onClose }) => {
  const [allFunctionalities, setAllFunctionalities] = useState([]);
  const [userFunctionalities, setUserFunctionalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Get all available functionalities
        const allFuncsResponse = await axios.get(`${API_URL}/funcionalidades`, config);
        setAllFunctionalities(allFuncsResponse.data);
        
        // Get user's assigned functionalities
        const userFuncsResponse = await axios.get(
          `${API_URL}/users/${user.cedula}/funcionalidades`, // Changed from usuarios to users
          config
        );
        setUserFunctionalities(userFuncsResponse.data);
      } catch (err) {
        console.error("Error fetching functionalities:", err);
        setError("Error al cargar las funcionalidades");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user.cedula]);

  const isFunctionalityAssigned = (functionalityId) => {
    return userFunctionalities.some(func => func.id_funcionalidad === functionalityId);
  };

  const toggleFunctionality = async (functionalityId, currentlyAssigned) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      if (currentlyAssigned) {
        // Remove functionality
        await axios.delete(
          `${API_URL}/users/${user.cedula}/funcionalidades/${functionalityId}`, // Changed from usuarios to users
          config
        );
        setSuccess(`Funcionalidad desactivada exitosamente`);
      } else {
        // Add functionality
        await axios.post(
          `${API_URL}/users/${user.cedula}/funcionalidades/${functionalityId}`, // Changed from usuarios to users
          {},
          config
        );
        setSuccess(`Funcionalidad activada exitosamente`);
      }
      
      // Refresh user's functionalities
      const response = await axios.get(
        `${API_URL}/users/${user.cedula}/funcionalidades`, // Changed from usuarios to users
        config
      );
      setUserFunctionalities(response.data);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error toggling functionality:", err);
      setError("Error al actualizar la funcionalidad");
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="functionality-modal">
      <div className="modal-header">
        <h2>Gestionar Funcionalidades de Usuario</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="user-info-section">
        <p><strong>Usuario:</strong> {user.nombre}</p>
        <p><strong>Cédula:</strong> {user.cedula}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {loading ? (
        <div className="loading">Cargando funcionalidades...</div>
      ) : (
        <div className="functionalities-list">
          <table>
            <thead>
              <tr>
                <th>Funcionalidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {allFunctionalities.map(func => {
                const isAssigned = isFunctionalityAssigned(func.id_funcionalidad);
                return (
                  <tr key={func.id_funcionalidad}>
                    <td>{func.nombre}</td>
                    <td className={isAssigned ? "status-active" : "status-inactive"}>
                      {isAssigned ? "Activa" : "Inactiva"}
                    </td>
                    <td>
                      <button 
                        className={`toggle-btn ${isAssigned ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => toggleFunctionality(func.id_funcionalidad, isAssigned)}
                        disabled={loading}
                      >
                        {isAssigned ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUserFunctionalities;