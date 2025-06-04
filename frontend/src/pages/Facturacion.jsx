import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import '../styles/facturacion.css';

const FacturacionPage = ({ userData }) => {
  // Estado para clientes y productos
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  
  // Estado para facturas
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showFacturaDetalleModal, setShowFacturaDetalleModal] = useState(false);
  
  // Estado para selección y formulario
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    cedula_nit: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [facturaForm, setFacturaForm] = useState({
    cliente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    subtotal: 0,
    iva: 0,
    total: 0
  });
  
  // Estado para productos en factura
  const [itemsFactura, setItemsFactura] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  
  // Estado para mensajes
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // API URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchClientes();
        
        // Solo intentar cargar productos si los clientes se cargaron bien
        try {
          const token = localStorage.getItem('token');
          const productosRes = await axios.get(`${API_URL}/productos`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          setProductos(productosRes.data);
        } catch (err) {
          console.error("Error al cargar productos:", err);
        }
        
        // Intentar cargar facturas solo si lo anterior funcionó
        await fetchFacturas();
        
      } catch (err) {
        console.error("Error general en carga inicial:", err);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Función mejorada para cargar clientes
  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No hay token disponible");
        setError('No hay sesión activa');
        return;
      }
      
      console.log("Intentando cargar clientes...");
      
      // Try with different request configuration
      try {
        const response = await axios.get(`${API_URL}/clientes`, {
          headers: { 
            'Authorization': `Bearer ${token}`
          },
          params: { active: true } // Try adding a default parameter
        });
        
        console.log("Respuesta clientes:", response.data);
        setClientes(response.data || []);
      } catch (initialError) {
        console.error("Error con primera configuración:", initialError);
        
        if (initialError.response && initialError.response.status === 422) {
          // Show full validation error details
          console.error("Detalles completos del error:", JSON.stringify(initialError.response.data));
          
          // Try alternate endpoint format
          const altResponse = await axios.get(`${API_URL}/cliente/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log("Respuesta alternativa:", altResponse.data);
          setClientes(altResponse.data || []);
        } else {
          throw initialError; // Re-throw if it's not a validation error
        }
      }
    } catch (err) {
      console.error("Error detallado al cargar clientes:", err);
      
      let errorMessage = 'Error al cargar clientes';
      if (err.response) {
        console.log("Estado:", err.response.status);
        console.log("Datos completos:", JSON.stringify(err.response.data));
        
        // Extract validation errors if present
        if (err.response.status === 422 && err.response.data.detail) {
          const validationErrors = Array.isArray(err.response.data.detail) 
            ? err.response.data.detail.map(e => e.msg || JSON.stringify(e)).join(", ")
            : err.response.data.detail;
          
          errorMessage += `: Error de validación - ${validationErrors}`;
        } else if (err.response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor inicie sesión nuevamente.';
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }, 3000);
        } else {
          errorMessage += `: ${err.response.status} - ${err.response.data?.detail || JSON.stringify(err.response.data) || 'Error de servidor'}`;
        }
      }
      setError(errorMessage);
      // Return empty array to prevent further errors
      setClientes([]);
    }
  };
  
  // Función mejorada para cargar facturas
  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No hay token disponible");
        setError('No hay sesión activa');
        return;
      }
      
      console.log("Intentando cargar facturas...");
      
      // Try with different request configuration
      try {
        const response = await axios.get(`${API_URL}/facturas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("Respuesta facturas:", response.data);
        
        // Enriquecer datos con información de clientes
        const facturasEnriquecidas = [...response.data];
        
        // Para cada factura, cargar datos completos del cliente si solo tenemos el ID
        for (let i = 0; i < facturasEnriquecidas.length; i++) {
          const factura = facturasEnriquecidas[i];
          if ((!factura.cliente || !factura.cliente.nombre) && factura.id_cliente) {
            try {
              const clienteResponse = await axios.get(`${API_URL}/clientes/${factura.id_cliente}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              facturasEnriquecidas[i].cliente = clienteResponse.data;
            } catch (clienteErr) {
              console.error(`Error al cargar datos del cliente ${factura.id_cliente}:`, clienteErr);
            }
          }
        }
        
        setFacturas(facturasEnriquecidas);
      } catch (initialError) {
        console.error("Error con primera configuración:", initialError);
        console.error("Detalles completos del error:", JSON.stringify(initialError.response?.data));
        
        // Try alternate endpoint format if needed
        // ... resto del código de manejo de errores existente ...
      }
    } catch (err) {
      // ... resto del código de manejo de errores existente ...
    } finally {
      setLoading(false);
    }
  };
  
  // Funciones para crear cliente
  const handleCreateCliente = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }
      
      const response = await axios.post(`${API_URL}/clientes`, clienteForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar lista de clientes
      setClientes([...clientes, response.data]);
      setSuccess('Cliente creado con éxito');
      setShowClienteModal(false);
      
      // Limpiar formulario
      setClienteForm({
        cedula_nit: '',
        nombre: '',
        telefono: '',
        email: '',
        direccion: ''
      });
    } catch (err) {
      console.error("Error al crear cliente:", err);
      setError(err.response?.data?.detail || 'Error al crear el cliente');
    }
  };
  
  const handleClienteFormChange = (e) => {
    setClienteForm({
      ...clienteForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Funciones para crear factura
  const handleFacturaFormChange = (e) => {
    setFacturaForm({
      ...facturaForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleProductoSelect = (e) => {
    setProductoSeleccionado(e.target.value);
  };
  
  const handleAddItem = () => {
    if (!productoSeleccionado || !cantidad) return;
    
    const producto = productos.find(p => p.id_producto === parseInt(productoSeleccionado));
    if (!producto) return;
    
    // Convertir valores
    const cantidadInt = parseInt(cantidad);
    const precioUnitario = parseFloat(producto.precio_venta);
    const subtotal = precioUnitario * cantidadInt;
    
    // Crear nuevo item
    const newItem = {
      id_producto: parseInt(producto.id_producto),
      producto_nombre: `${producto.codigo} - ${producto.nombre}`,
      cantidad: cantidadInt,
      precio_unitario: precioUnitario,
      subtotal: subtotal
    };
    
    // Actualizar items y totales
    const newItems = [...itemsFactura, newItem];
    setItemsFactura(newItems);
    setProductoSeleccionado('');
    setCantidad(1);
    
    // Recalcular totales
    const nuevoSubtotal = newItems.reduce((acc, item) => acc + item.subtotal, 0);
    const nuevoIva = nuevoSubtotal * 0.19; // 19% IVA
    
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
    
    // Actualizar items y recalcular totales
    setItemsFactura(newItems);
    
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
    
    try {
      // Limpiar mensajes previos
      setError(null);
      setSuccess(null);
      
      // Preparar datos - ¡IMPORTANTE: asegurarse que usemos producto_id!
      const facturaData = {
        fecha: facturaForm.fecha,
        cliente_id: selectedCliente?.id_cliente || facturaForm.cliente_id,
        subtotal: facturaForm.subtotal,
        iva: facturaForm.iva,
        total: facturaForm.total,
        items: itemsFactura.map(item => ({
          producto_id: parseInt(item.id_producto), // Usamos producto_id de acuerdo al esquema del backend
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal)
        }))
      };
      
      // Validaciones
      if (!facturaData.cliente_id) {
        setError('Debe seleccionar un cliente para la factura');
        return;
      }
      
      if (!facturaData.fecha) {
        setError('La fecha de la factura es requerida');
        return;
      }
      
      if (facturaData.items.length === 0) {
        setError('Debe agregar al menos un producto a la factura');
        return;
      }
      
      // Obtener token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay sesión activa');
        return;
      }
      
      console.log("Enviando factura:", facturaData);
      
      // Enviar datos
      const response = await axios.post(`${API_URL}/facturas`, facturaData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Procesamiento exitoso
      setSuccess('Factura creada con éxito');
      await fetchFacturas();
      
      // Reiniciar formulario
      setShowFacturaModal(false);
      setFacturaForm({
        cliente_id: '',
        fecha: new Date().toISOString().split('T')[0],
        subtotal: 0,
        iva: 0,
        total: 0
      });
      setItemsFactura([]);
      setSelectedCliente(null);
      
    } catch (err) {
      console.error('Error al crear factura:', err);
      
      let errorMsg = 'Error al crear la factura';
      
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          errorMsg += `: ${err.response.data.detail}`;
        } else {
          errorMsg += ` (código: ${err.response.status})`;
        }
      } else if (err.request) {
        errorMsg += ': No se recibió respuesta del servidor';
      } else {
        errorMsg += `: ${err.message}`;
      }
      
      setError(errorMsg);
    }
  };
  
  // Función para mostrar detalle de factura
  const handleViewFactura = async (factura) => {
    try {
      // Cargar los detalles completos de la factura
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/facturas/${factura.id_factura}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log("Detalle de factura recibido:", response.data);
      
      // Enriquecer los datos de la factura con información adicional
      const facturaDetallada = {...response.data};
      
      // Si la factura no tiene cliente completo, buscarlo por ID
      if ((!facturaDetallada.cliente || !facturaDetallada.cliente.nombre) && facturaDetallada.id_cliente) {
        try {
          const clienteResponse = await axios.get(`${API_URL}/clientes/${facturaDetallada.id_cliente}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          facturaDetallada.cliente = clienteResponse.data;
        } catch (clienteErr) {
          console.error("Error al cargar datos del cliente:", clienteErr);
        }
      }
      
      // Enriquecer los productos en los detalles con nombres completos
      if (facturaDetallada.detalles && facturaDetallada.detalles.length > 0) {
        for (let i = 0; i < facturaDetallada.detalles.length; i++) {
          const detalle = facturaDetallada.detalles[i];
          if ((!detalle.producto || !detalle.producto.nombre) && (detalle.producto_id || detalle.id_producto)) {
            const productoId = detalle.producto_id || detalle.id_producto;
            try {
              const productoResponse = await axios.get(`${API_URL}/productos/${productoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              facturaDetallada.detalles[i].producto = productoResponse.data;
            } catch (productoErr) {
              console.error(`Error al cargar datos del producto ${productoId}:`, productoErr);
            }
          }
        }
      }
      
      setSelectedFactura(facturaDetallada);
      setShowFacturaDetalleModal(true);
    } catch (err) {
      console.error("Error al cargar detalle de factura:", err);
      setError("No se pudo cargar el detalle de la factura");
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
        
        {/* Mensajes de éxito y error */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {/* Sección de clientes */}
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
                    <td>{cliente.telefono || '-'}</td>
                    <td>{cliente.email || '-'}</td>
                    <td>{cliente.direccion || '-'}</td>
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
        
        {/* Sección de facturas */}
        <div className="facturas-section">
          <h2>Facturas (Recibos de Caja Menor)</h2>
          <div className="aviso-legal">
            <p><strong>Nota:</strong> Estos documentos son recibos de caja menor y NO constituyen facturas electrónicas válidas ante la DIAN.</p>
          </div>
          {loading ? (
            <p className="loading">Cargando facturas...</p>
          ) : (
            <table className="facturas-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Subtotal</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No hay facturas para mostrar</td>
                  </tr>
                ) : (
                  facturas.map(factura => (
                    <tr key={factura.id_factura}>
                      <td>{factura.numero_factura}</td>
                      <td>
                        {factura.cliente?.nombre || 
                         factura.cliente_nombre || 
                         (factura.id_cliente ? `Cliente ID: ${factura.id_cliente}` : 'Cliente no disponible')}
                      </td>
                      <td>{new Date(factura.fecha).toLocaleDateString()}</td>
                      <td className="numeric">${factura.subtotal}</td>
                      <td className="numeric">${factura.iva}</td>
                      <td className="numeric">${factura.total}</td>
                      <td><span className={`estado-${factura.estado?.toLowerCase()}`}>{factura.estado}</span></td>
                      <td className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => handleViewFactura(factura)}
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Modal para crear cliente */}
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
      
      {/* Modal para crear factura */}
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
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        min="1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="button" 
                        className="btn-add-item"
                        onClick={handleAddItem}
                      >
                        Agregar Producto
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="factura-items">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsFactura.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="no-data">No hay productos agregados</td>
                        </tr>
                      ) : (
                        itemsFactura.map((item, index) => (
                          <tr key={index}>
                            <td>{item.producto_nombre}</td>
                            <td>{item.cantidad}</td>
                            <td>${item.precio_unitario.toFixed(2)}</td>
                            <td>${item.subtotal.toFixed(2)}</td>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="factura-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>${facturaForm.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>IVA (19%):</span>
                    <span>${facturaForm.iva.toFixed(2)}</span>
                  </div>
                  <div className="total-row total">
                    <span>Total:</span>
                    <span>${facturaForm.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={() => setShowFacturaModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Crear Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal para ver detalles de factura */}
      {showFacturaDetalleModal && selectedFactura && (
        <div className="modal-backdrop">
          <div className="modal factura-modal">
            <div className="modal-header">
              <h2>Detalle de Recibo de Caja Menor</h2>
              <button className="close-btn" onClick={() => setShowFacturaDetalleModal(false)}>×</button>
            </div>
            
            <div className="factura-detalle-contenido">
              <div className="factura-info-header">
                <div className="recibo-aviso">
                  <h3>RECIBO DE CAJA MENOR</h3>
                  <p className="aviso-legal">Este documento NO es una factura electrónica válida ante la DIAN</p>
                </div>
                
                <div className="factura-numero">
                  <h4>Recibo N°: {selectedFactura.numero_factura}</h4>
                  <p>Fecha: {new Date(selectedFactura.fecha).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="factura-cliente-info">
                <h4>Datos del Cliente</h4>
                <p><strong>Cliente:</strong> {selectedFactura.cliente?.nombre || selectedFactura.cliente_nombre || 'N/A'}</p>
                <p><strong>Identificación:</strong> {selectedFactura.cliente?.cedula_nit || selectedFactura.cliente_cedula || 'N/A'}</p>
                <p><strong>Dirección:</strong> {selectedFactura.cliente?.direccion || selectedFactura.cliente_direccion || 'N/A'}</p>
              </div>
              
              <div className="factura-items-detalle">
                <h4>Productos</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedFactura.detalles || selectedFactura.detalles.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="no-data">No hay productos en esta factura</td>
                      </tr>
                    ) : (
                      selectedFactura.detalles.map((detalle, index) => (
                        <tr key={index}>
                          <td>
                            {detalle.producto?.nombre 
                              ? `${detalle.producto.codigo || ''} - ${detalle.producto.nombre}` 
                              : detalle.producto_nombre || `Producto ID: ${detalle.producto_id || detalle.id_producto}`}
                          </td>
                          <td className="numeric">{detalle.cantidad}</td>
                          <td className="numeric">${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                          <td className="numeric">${parseFloat(detalle.subtotal).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="factura-totals factura-detalle-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${parseFloat(selectedFactura.subtotal).toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>IVA (19%):</span>
                  <span>${parseFloat(selectedFactura.iva).toFixed(2)}</span>
                </div>
                <div className="total-row total">
                  <span>Total:</span>
                  <span>${parseFloat(selectedFactura.total).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="factura-footer">
                <p>Este documento es un comprobante de pago y no tiene validez como factura electrónica.</p>
                <p>Gracias por su compra.</p>
              </div>
            </div>
            
            <div className="form-buttons">
              <button className="btn-print" onClick={() => window.print()}>Imprimir</button>
              <button className="btn-cancel" onClick={() => setShowFacturaDetalleModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturacionPage;