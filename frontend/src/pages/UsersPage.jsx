import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ManageUserFunctionalities from '../components/ManageUserFunctionalities';
import UserForm from '../components/UserForm'; // We'll create this component
import { getUsers, createUser, deleteUser } from '../api/users'; // Using your existing API functions
import { getRoles } from '../api/roles'; // Using your existing API function
import Navbar from '../components/Navbar';
import { jwtDecode } from 'jwt-decode';
import '../styles/usersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFunctionalitiesModal, setShowFunctionalitiesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    
    // Get user data from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData(decoded);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const handleManageFunctionalities = (user) => {
    setSelectedUser(user);
    setShowFunctionalitiesModal(true);
  };

  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData);
      fetchUsers(); // Refresh user list
      setShowCreateModal(false);
      setError("");
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.detail || "Error al crear el usuario");
    }
  };
  
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete.cedula);
      fetchUsers(); // Refresh user list
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.detail || "Error al eliminar el usuario");
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setShowFunctionalitiesModal(false);
    setShowCreateModal(false);
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  if (loading) return <div className="loading">Cargando usuarios...</div>;
  
  return (
    <div className="users-page">
      <Navbar userData={userData} />
      
      <div className="users-header">
        <h1>Gestión de Usuarios</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          Crear Nuevo Usuario
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Tabla de usuarios */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.cedula}>
                <td>{user.cedula}</td>
                <td>{user.nombre}</td>
                <td>{user.email}</td>
                <td>{user.telefono}</td>
                <td>{user.rol?.nombre || 'Sin rol'}</td>
                <td className="action-buttons">
                  <button 
                    className="btn-functionalities" 
                    onClick={() => handleManageFunctionalities(user)}
                  >
                    Funcionalidades
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteClick(user)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de gestión de funcionalidades */}
      {showFunctionalitiesModal && selectedUser && (
        <div className="modal-backdrop">
          <ManageUserFunctionalities 
            user={selectedUser} 
            onClose={closeModal} 
          />
        </div>
      )}
      
      {/* Modal para crear usuario */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <UserForm 
            onSubmit={handleCreateUser} 
            onCancel={closeModal}
            roles={roles}
          />
        </div>
      )}
      
      {/* Modal para confirmar eliminación */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p>¿Está seguro que desea eliminar al usuario {userToDelete.nombre}?</p>
              <p>Esta acción no se puede deshacer.</p>
            </div>
            <div className="form-buttons">
              <button className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button className="btn-submit" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;