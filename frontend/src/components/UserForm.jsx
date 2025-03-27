import React, { useState } from 'react';
import '../styles/Users.css';

const UserForm = ({ onSubmit, onCancel, roles }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion_empleado: '',
    contraseña_login: '',
    tipo_usuario_rol: roles.length > 0 ? roles[0].id_rol : 1
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.cedula.trim()) newErrors.cedula = 'La cédula es requerida';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El email no es válido';
    if (!formData.direccion_empleado.trim()) newErrors.direccion_empleado = 'La dirección es requerida';
    if (!formData.contraseña_login) newErrors.contraseña_login = 'La contraseña es requerida';
    else if (formData.contraseña_login.length < 6) newErrors.contraseña_login = 'La contraseña debe tener al menos 6 caracteres';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h3>Crear Nuevo Usuario</h3>
        <button className="close-btn" onClick={onCancel}>&times;</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre completo</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={errors.nombre ? 'error' : ''}
          />
          {errors.nombre && <div className="error-text">{errors.nombre}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="cedula">Cédula</label>
          <input
            type="text"
            id="cedula"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            className={errors.cedula ? 'error' : ''}
          />
          {errors.cedula && <div className="error-text">{errors.cedula}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="text"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className={errors.telefono ? 'error' : ''}
          />
          {errors.telefono && <div className="error-text">{errors.telefono}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <div className="error-text">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="direccion_empleado">Dirección</label>
          <input
            type="text"
            id="direccion_empleado"
            name="direccion_empleado"
            value={formData.direccion_empleado}
            onChange={handleChange}
            className={errors.direccion_empleado ? 'error' : ''}
          />
          {errors.direccion_empleado && <div className="error-text">{errors.direccion_empleado}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="contraseña_login">Contraseña</label>
          <input
            type="password"
            id="contraseña_login"
            name="contraseña_login"
            value={formData.contraseña_login}
            onChange={handleChange}
            className={errors.contraseña_login ? 'error' : ''}
          />
          {errors.contraseña_login && <div className="error-text">{errors.contraseña_login}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="tipo_usuario_rol">Rol</label>
          <select
            id="tipo_usuario_rol"
            name="tipo_usuario_rol"
            value={formData.tipo_usuario_rol}
            onChange={handleChange}
          >
            {roles.map(role => (
              <option key={role.id_rol} value={role.id_rol}>
                {role.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-buttons">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn-submit">Crear Usuario</button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;