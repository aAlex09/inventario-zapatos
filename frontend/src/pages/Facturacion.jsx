import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';

const FacturacionPage = ({ userData }) => {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    cedula_nit: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientesRes = await axios.get('/api/clientes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setClientes(clientesRes.data);
        
        const productosRes = await axios.get('/api/productos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProductos(productosRes.data);
      } catch (err) {
        setError('Error al cargar los datos');
      }
    };

    fetchData();
  }, []);

  const handleCreateCliente = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/clientes', clienteForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setClientes([...clientes, response.data]);
      setSuccess('Cliente creado con éxito');
      setShowClienteModal(false);
      
      // Reset form
      setClienteForm({
        cedula_nit: '',
        nombre: '',
        telefono: '',
        email: '',
        direccion: ''
      });
    } catch (err) {
      setError('Error al crear el cliente');
    }
  };

  const handleClienteFormChange = (e) => {
    setClienteForm({
      ...clienteForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="page-container">
      <Navbar userData={userData} />
      
      <div className="content-container">
        <div className="facturacion-header">
          <h1>Facturación</h1>
          <div className="action-buttons">
            <button 
              className="btn-primary" 
              onClick={() => setShowClienteModal(true)}
            >
              Nuevo Cliente
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowFacturaModal(true)}
            >
              Nueva Factura
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="clientes-section">
          <h2>Clientes</h2>
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Cédula/NIT</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">No hay clientes para mostrar</td>
                </tr>
              ) : (
                clientes.map(cliente => (
                  <tr key={cliente.id_cliente}>
                    <td>{cliente.cedula_nit}</td>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.direccion}</td>
                    <td className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowFacturaModal(true);
                        }}
                      >
                        Facturar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal for creating new customers */}
      {showClienteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Crear Nuevo Cliente</h2>
              <button className="close-btn" onClick={() => setShowClienteModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCliente}>
              <div className="form-group">
                <label>Cédula/NIT</label>
                <input 
                  type="text" 
                  name="cedula_nit" 
                  value={clienteForm.cedula_nit}
                  onChange={handleClienteFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={clienteForm.nombre}
                  onChange={handleClienteFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="text" 
                  name="telefono" 
                  value={clienteForm.telefono}
                  onChange={handleClienteFormChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={clienteForm.email}
                  onChange={handleClienteFormChange}
                />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input 
                  type="text" 
                  name="direccion" 
                  value={clienteForm.direccion}
                  onChange={handleClienteFormChange}
                />
              </div>
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={() => setShowClienteModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Here you would implement the invoice creation modal */}
    </div>
  );
};

export default FacturacionPage;