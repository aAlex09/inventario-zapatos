import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import '../styles/facturacion.css';
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
  const [facturaForm, setFacturaForm] = useState({
    cliente_id: '',
    items: [],
    fecha: new Date().toISOString().split('T')[0],
    subtotal: 0,
    iva: 0,
    total: 0
  });
  const [itemsFactura, setItemsFactura] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  
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

  const handleFacturaFormChange = (e) => {
    const { name, value } = e.target;
    setFacturaForm({
      ...facturaForm,
      [name]: value
    });
  };

  const handleProductoSelect = (e) => {
    setProductoSeleccionado(e.target.value);
  };

  const handleAddItem = () => {
    if (!productoSeleccionado || cantidad <= 0) {
      setError('Seleccione un producto y especifique una cantidad válida');
      return;
    }

    const producto = productos.find(p => p.id_producto === parseInt(productoSeleccionado));
    if (!producto) return;

    const newItem = {
      producto_id: producto.id_producto,
      producto_nombre: producto.nombre,
      cantidad: parseInt(cantidad),
      precio_unitario: producto.precio_venta,
      subtotal: producto.precio_venta * parseInt(cantidad)
    };

    setItemsFactura([...itemsFactura, newItem]);
    setProductoSeleccionado('');
    setCantidad(1);
    
    // Recalculate totals
    const nuevoSubtotal = [...itemsFactura, newItem].reduce((acc, item) => acc + item.subtotal, 0);
    const nuevoIva = nuevoSubtotal * 0.19; // Assuming 19% IVA
    
    setFacturaForm({
      ...facturaForm,
      subtotal: nuevoSubtotal,
      iva: nuevoIva,
      total: nuevoSubtotal + nuevoIva
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...itemsFactura];
    newItems.splice(index, 1);
    setItemsFactura(newItems);
    
    // Recalculate totals
    const nuevoSubtotal = newItems.reduce((acc, item) => acc + item.subtotal, 0);
    const nuevoIva = nuevoSubtotal * 0.19;
    
    setFacturaForm({
      ...facturaForm,
      subtotal: nuevoSubtotal,
      iva: nuevoIva,
      total: nuevoSubtotal + nuevoIva
    });
  };

  const handleCreateFactura = async (e) => {
    e.preventDefault();
    
    if (itemsFactura.length === 0) {
      setError('Debe agregar al menos un producto a la factura');
      return;
    }
    
    try {
      const facturaData = {
        ...facturaForm,
        cliente_id: selectedCliente?.id_cliente || facturaForm.cliente_id,
        items: itemsFactura
      };
      
      const response = await axios.post('/api/facturas', facturaData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSuccess('Factura creada con éxito');
      setShowFacturaModal(false);
      
      // Reset form
      setFacturaForm({
        cliente_id: '',
        items: [],
        fecha: new Date().toISOString().split('T')[0],
        subtotal: 0,
        iva: 0,
        total: 0
      });
      setItemsFactura([]);
      setSelectedCliente(null);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Error al crear la factura');
    }
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
      
      {/* Invoice Creation Modal */}
      {showFacturaModal && (
        <div className="modal-backdrop">
          <div className="modal factura-modal">
            <div className="modal-header">
              <h2>Crear Nueva Factura</h2>
              <button className="close-btn" onClick={() => {
                setShowFacturaModal(false);
                setItemsFactura([]);
                setSelectedCliente(null);
              }}>×</button>
            </div>
            
            <form onSubmit={handleCreateFactura}>
              <div className="factura-info">
                <div className="cliente-info">
                  <h3>Información del Cliente</h3>
                  {selectedCliente ? (
                    <div className="selected-cliente">
                      <p><strong>Cliente:</strong> {selectedCliente.nombre}</p>
                      <p><strong>Cédula/NIT:</strong> {selectedCliente.cedula_nit}</p>
                      <p><strong>Dirección:</strong> {selectedCliente.direccion || 'N/A'}</p>
                      <button 
                        type="button" 
                        className="btn-small"
                        onClick={() => setSelectedCliente(null)}
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Seleccione un Cliente</label>
                      <select 
                        name="cliente_id" 
                        value={facturaForm.cliente_id}
                        onChange={handleFacturaFormChange}
                        required
                      >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente.id_cliente} value={cliente.id_cliente}>
                            {cliente.cedula_nit} - {cliente.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    name="fecha" 
                    value={facturaForm.fecha}
                    onChange={handleFacturaFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="productos-factura">
                <h3>Productos</h3>
                
                <div className="add-item-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Producto</label>
                      <select 
                        value={productoSeleccionado}
                        onChange={handleProductoSelect}
                        required
                      >
                        <option value="">Seleccione un producto</option>
                        {productos.map(producto => (
                          <option key={producto.id_producto} value={producto.id_producto}>
                            {producto.codigo} - {producto.nombre} (${producto.precio_venta})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Cantidad</label>
                      <input 
                        type="number" 
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        required
                      />
                    </div>
                    
                    <button 
                      type="button" 
                      className="btn-add-item"
                      onClick={handleAddItem}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
                
                {itemsFactura.length > 0 ? (
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsFactura.map((item, index) => (
                        <tr key={index}>
                          <td>{item.producto_nombre}</td>
                          <td>{item.cantidad}</td>
                          <td>${item.precio_unitario.toLocaleString()}</td>
                          <td>${item.subtotal.toLocaleString()}</td>
                          <td>
                            <button 
                              type="button"
                              className="btn-remove"
                              onClick={() => handleRemoveItem(index)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-items">No hay productos agregados a la factura</p>
                )}
                
                <div className="factura-totals">
                  <div className="totals-row">
                    <span>Subtotal:</span>
                    <span>${facturaForm.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="totals-row">
                    <span>IVA (19%):</span>
                    <span>${facturaForm.iva.toLocaleString()}</span>
                  </div>
                  <div className="totals-row total">
                    <span>Total:</span>
                    <span>${facturaForm.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowFacturaModal(false);
                    setItemsFactura([]);
                    setSelectedCliente(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={itemsFactura.length === 0}
                >
                  Crear Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturacionPage;