import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { getRoles } from "../api/roles";
import { getFuncionalidades, getUserFuncionalidades } from "../api/funcionalidades";
import Navbar from "../components/Navbar";
import "../styles/Users.css";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getConfig = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [funcionalidades, setFuncionalidades] = useState([]);
  const [selectedFuncionalidades, setSelectedFuncionalidades] = useState([]);
  const [userFuncionalidades, setUserFuncionalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    email: "",
    direccion_empleado: "",
    contraseña_login: "",
    tipo_usuario_rol: 0
  });
  
  // Verificar el token al cargar la página
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      try {
        // Decode the JWT token to get user info
        const decoded = jwtDecode(token);
        setUserData(decoded);
        
        // Verificar si es administrador
        if (decoded.role !== 1) {
          // Si no es administrador, redirigir al dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Load users and roles on component mount
  useEffect(() => {
    if (!userData) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, rolesData, funcionesData] = await Promise.all([
          getUsers(),
          getRoles(),
          getFuncionalidades()
        ]);
        
        console.log("Usuarios cargados:", usersData);
        console.log("Roles cargados:", rolesData);
        console.log("Funcionalidades cargadas:", funcionesData);
        
        setUsers(usersData);
        setRoles(rolesData);
        setFuncionalidades(funcionesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error cargando datos. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "tipo_usuario_rol" ? parseInt(value) : value
    });
  };

  const handleOpenCreateModal = () => {
    setFormData({
      nombre: "",
      cedula: "",
      telefono: "",
      email: "",
      direccion_empleado: "",
      contraseña_login: "",
      tipo_usuario_rol: roles.length > 0 ? roles[0].id_rol : 0
    });
    setModalMode("create");
    setShowModal(true);
  };

  const handleOpenEditModal = async (user) => {
    setCurrentUser(user);
    setFormData({
        ...user,
        contraseña_login: "",
        tipo_usuario_rol: user.tipo_usuario_rol
    });
    
    try {
        // Cargar funcionalidades del usuario
        const userFuncs = await getUserFuncionalidades(user.cedula);
        console.log("Funcionalidades del usuario:", userFuncs);
        
        // Filtrar solo las funcionalidades activas
        const activeFuncs = userFuncs
            .filter(f => f.estado)
            .map(f => f.id_funcionalidad);
            
        setSelectedFuncionalidades(activeFuncs);
    } catch (error) {
        console.error("Error loading user funcionalidades:", error);
        setError("Error cargando funcionalidades del usuario");
    }
    
    setModalMode("edit");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        const dataToSend = {
            ...formData,
            funcionalidades: [...new Set(selectedFuncionalidades)]
        };
        
        if (modalMode === "create") {
            await createUser(dataToSend);
        } else {
            // Solo enviar los campos que han sido modificados
            const updatedFields = {};
            Object.keys(dataToSend).forEach(key => {
                if (dataToSend[key] !== undefined && 
                    dataToSend[key] !== '' && 
                    (key === 'funcionalidades' || dataToSend[key] !== currentUser[key])) {
                    updatedFields[key] = dataToSend[key];
                }
            });

            await updateUser(currentUser.cedula, updatedFields);
        }

        // Recargar la lista de usuarios
        const updatedUsersList = await getUsers();
        setUsers(updatedUsersList);
        
        // Mostrar mensaje de éxito
        setError("");
        handleCloseModal();
    } catch (err) {
        console.error("Error:", err);
        setError(
            modalMode === "create" 
                ? "Error creando usuario" 
                : "Error actualizando usuario"
        );
        return; // Evitar cerrar el modal si hay error
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };
  
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await deleteUser(userToDelete.cedula);
      setUsers(users.filter(user => user.cedula !== userToDelete.cedula));
      setError("");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error eliminando usuario. Intente nuevamente.");
    } finally {
      handleCloseDeleteModal();
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(role => role.id_rol === roleId);
    return role ? role.nombre : "Desconocido";
  };

  const handleFuncionalidadToggle = (funcionalidadId) => {
    setSelectedFuncionalidades(prev => {
        if (prev.includes(funcionalidadId)) {
            return prev.filter(id => id !== funcionalidadId);
        } else {
            return [...prev, funcionalidadId];
        }
    });
  };

  if (loading) {
    return (
      <>
        <Navbar userData={userData} />
        <div className="loading">Cargando usuarios...</div>
      </>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar userData={userData} />
      
      <div className="dashboard-content">
        <div className="users-container">
          <div className="users-header">
            <h2>Gestión de Usuarios</h2>
            <button 
              className="btn btn-primary" 
              onClick={handleOpenCreateModal}
            >
              Nuevo Usuario
            </button>
          </div>

          {error && <div className="users-error">{error}</div>}

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-users">No hay usuarios registrados</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.cedula}>
                      <td>{user.nombre}</td>
                      <td>{user.cedula}</td>
                      <td>{user.email}</td>
                      <td>{user.telefono}</td>
                      <td>{getRoleName(user.tipo_usuario_rol)}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn-edit"
                          onClick={() => handleOpenEditModal(user)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleOpenDeleteModal(user)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User Modal Form para actualizar*/}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{modalMode === "create" ? "Crear Nuevo Usuario" : "Editar Usuario"}</h3>
                  <button className="close-btn" onClick={handleCloseModal}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre Completo</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cedula">Cédula</label>
                    <input
                      type="text"
                      id="cedula"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="text"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="direccion_empleado">Dirección</label>
                    <input
                      type="text"
                      id="direccion_empleado"
                      name="direccion_empleado"
                      value={formData.direccion_empleado}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contraseña_login">
                      {modalMode === "create" ? "Contraseña" : "Nueva Contraseña (Dejar en blanco para mantener)"}
                    </label>
                    <input
                      type="password"
                      id="contraseña_login"
                      name="contraseña_login"
                      value={formData.contraseña_login}
                      onChange={handleInputChange}
                      required={modalMode === "create"}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="tipo_usuario_rol">Rol</label>
                    <select
                      id="tipo_usuario_rol"
                      name="tipo_usuario_rol"
                      value={formData.tipo_usuario_rol}
                      onChange={handleInputChange}
                      required
                    >
                      {roles.map(role => (
                        <option key={role.id_rol} value={role.id_rol}>
                          {role.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Funcionalidades</label>
                    <table className="tabla-funcionalidades">
                        <thead>
                            <tr>
                                <th>Funcionalidad</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funcionalidades.map(func => (
                                <tr key={func.id_funcionalidad}>
                                    <td>{func.nombre}</td>
                                    <td>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={selectedFuncionalidades.includes(func.id_funcionalidad)}
                                                onChange={() => handleFuncionalidadToggle(func.id_funcionalidad)}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                  
                  <div className="form-buttons">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-submit">
                      {modalMode === "create" ? "Crear Usuario" : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>¿Eliminar Usuario?</h3>
                  <button className="close-btn" onClick={handleCloseDeleteModal}>×</button>
                </div>

                <div className="modal-body">
                  <p>
                    ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.nombre}</strong> con cédula <strong>{userToDelete?.cedula}</strong>?
                  </p>
                </div>

                <div className="form-buttons">
                  <button className="btn-cancel" onClick={handleCloseDeleteModal}>
                    Cancelar
                  </button>
                  <button className="btn-submit btn-danger" onClick={handleConfirmDelete}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}