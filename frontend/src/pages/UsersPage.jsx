import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { getRoles } from "../api/roles";
import Navbar from "../components/Navbar";
import "../styles/Users.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
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
    if (!userData) return; // No cargar datos si no hay usuario
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, rolesData] = await Promise.all([
          getUsers(),
          getRoles()
        ]);
        
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error cargando datos. Intente nuevamente más tarde.");
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

  const handleOpenEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      nombre: user.nombre,
      cedula: user.cedula,
      telefono: user.telefono,
      email: user.email,
      direccion_empleado: user.direccion_empleado,
      contraseña_login: "", // Don't show the password
      tipo_usuario_rol: user.tipo_usuario_rol
    });
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
      let updatedUsers;
      
      if (modalMode === "create") {
        const newUser = await createUser(formData);
        updatedUsers = [...users, newUser];
      } else {
        // Edit mode
        const updatedUser = await updateUser(currentUser.id_usuario, formData);
        updatedUsers = users.map(user => 
          user.id_usuario === currentUser.id_usuario ? updatedUser : user
        );
      }
      
      setUsers(updatedUsers);
      handleCloseModal();
      setError("");
    } catch (err) {
      console.error("Error:", err);
      setError(
        modalMode === "create" 
          ? "Error creando usuario. Intente nuevamente." 
          : "Error actualizando usuario. Intente nuevamente."
      );
    }
  };

  const handleDeleteUser = async (cedula) => {
    if (!window.confirm("¿Está seguro que desea eliminar este usuario?")) {
      return;
    }
    
    try {
      await deleteUser(cedula);
      setUsers(users.filter(user => user.cedula !== cedula));
      setError("");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error eliminando usuario. Intente nuevamente.");
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(role => role.id_rol === roleId);
    return role ? role.nombre : "Desconocido";
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
                    <tr key={user.id_usuario}>
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
                          onClick={() => handleDeleteUser(user.cedula)}
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

          {/* User Modal Form */}
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
        </div>
      </div>
    </div>
  );
}