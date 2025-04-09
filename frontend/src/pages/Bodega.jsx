import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const BodegaPage = ({ userData }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    id_producto: '',
    tipo_movimiento: 'ENTRADA',
    cantidad: 1,
    precio_unitario: 0, // Añadir precio unitario
    referencia: '',
    notas: ''
  });
  const [success, setSuccess] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        console.log('Intentando obtener productos de bodega...');
        console.log('Token presente:', !!localStorage.getItem('token'));
        
        // Intenta primero usando la ruta completa
        let response;
        try {
          response = await axios.get(`${API_URL}/bodega/productos`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (initialError) {
          console.log('Error con ruta completa, intentando ruta relativa...');
          // Si falla, intenta con la ruta relativa
          response = await axios.get('/api/bodega/productos', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        }
        
        console.log('Respuesta recibida:', response.data);
        
        // Verificar y sanitizar datos
        const productosValidados = response.data.map(producto => ({
          ...producto,
          id_producto: producto.id_producto || 0,
          codigo: producto.codigo || 'Sin código',
          nombre: producto.nombre || 'Sin nombre',
          stock: producto.stock || 0
        }));
        
        setProductos(productosValidados);
        setLoading(false);
      } catch (err) {
        console.error('Error completo:', err);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        
        // Mensaje de error más descriptivo
        let errorMsg = 'Error al cargar los productos';
        if (err.response) {
          if (err.response.status === 404) {
            errorMsg += ': Ruta no encontrada. Verifica la configuración del API.';
          } else if (err.response.status === 401) {
            errorMsg += ': Sesión expirada o no autorizada.';
            // Redirigir al login
            setTimeout(() => {
              localStorage.removeItem('token');
              window.location.href = '/';
            }, 3000);
          } else {
            errorMsg += `: ${err.response.data?.detail || err.response.statusText}`;
          }
        } else if (err.request) {
          errorMsg += ': No se pudo conectar con el servidor.';
        } else {
          errorMsg += `: ${err.message}`;
        }
        
        setError(errorMsg);
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const handleMovementFormChange = (e) => {
    const { name, value } = e.target;
    setMovementForm({
      ...movementForm,
      [name]: name === 'cantidad' ? parseInt(value) || 0 : value
    });
  };

  const handleProductSelect = (e) => {
    const productId = parseInt(e.target.value);
    const product = productos.find(p => p.id_producto === productId);
    setSelectedProduct(product);
    setMovementForm({
      ...movementForm,
      id_producto: productId,
      precio_unitario: product ? product.precio_venta : 0 // Usar el precio de venta del producto seleccionado
    });
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    
    // Validate stock for outbound movements
    if (movementForm.tipo_movimiento === 'SALIDA') {
      const currentStock = selectedProduct?.stock || 0;
      if (movementForm.cantidad > currentStock) {
        setErrorModalMessage(`Error: Stock insuficiente. Stock actual: ${currentStock}`);
        setShowErrorModal(true);
        return;
      }
    }

    try {
      // Validate form
      if (!movementForm.id_producto || !movementForm.cantidad) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }
      
      if (movementForm.cantidad <= 0) {
        setError('La cantidad debe ser mayor a cero');
        return;
      }
      
      // Send request to backend
      const response = await axios.post(`${API_URL}/movimientos`, movementForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Show success message
      setSuccess('Movimiento registrado exitosamente');
      
      // Reset form and close modal
      setMovementForm({
        id_producto: '',
        tipo_movimiento: 'ENTRADA',
        cantidad: 1,
        precio_unitario: 0, // Añadir precio unitario aquí también
        referencia: '',
        notas: ''
      });
      setSelectedProduct(null);
      setShowMovementModal(false);
      
      try {
        // Refresh product list to show updated stock
        const productsResponse = await axios.get(`${API_URL}/bodega/productos`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Verificar y sanitizar datos
        const productosValidados = productsResponse.data.map(producto => ({
          ...producto,
          id_producto: producto.id_producto || 0,
          codigo: producto.codigo || 'Sin código',
          nombre: producto.nombre || 'Sin nombre',
          stock: producto.stock || 0
        }));
        
        setProductos(productosValidados);
      } catch (refreshErr) {
        console.error('Error al actualizar la lista:', refreshErr);
        // No mostramos error aquí para no sobreescribir el mensaje de éxito
      }
    } catch (err) {
      console.error('Error completo:', err);
      let errorMsg = 'Error al registrar el movimiento';
      
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
        
        if (err.response.status === 404) {
          errorMsg = 'Error 404: Endpoint no encontrado. Verifica la ruta del API.';
        } else if (err.response.status === 400) {
          errorMsg = `Error en los datos: ${err.response.data.detail || 'Verifica los campos'}`;
        } else if (err.response.status === 401) {
          errorMsg = 'Sesión expirada o credenciales inválidas';
        } else {
          errorMsg = `Error ${err.response.status}: ${err.response.data.detail || err.response.statusText}`;
        }
      } else if (err.request) {
        errorMsg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        errorMsg = `Error inesperado: ${err.message}`;
      }
      
      setError(errorMsg);
    }
  };

  return (
    <div className="page-container">
      <Navbar userData={userData} />
      
      <div className="content-container">
        <div className="inventory-header">
          <h1>Gestión de Bodega</h1>
          <button 
            className="btn-primary create-movement-btn"
            onClick={() => setShowMovementModal(true)}
          >
            Registrar Movimiento
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No hay productos para mostrar</td>
                  </tr>
                ) : (
                  productos.map((producto, index) => (
                    <tr key={producto.id_producto || index}>
                      <td className="image-cell">
                        {producto.imagen_url ? (
                          <img 
                            src={producto.imagen_url} 
                            alt={producto.nombre || 'Producto'} 
                            className="product-image"
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = "https://via.placeholder.com/80?text=No+Image"; 
                            }}
                          />
                        ) : (
                          <div className="no-image">📷</div>
                        )}
                      </td>
                      <td>{producto.codigo || 'Sin código'}</td>
                      <td>{producto.nombre || 'Sin nombre'}</td>
                      <td>{producto.stock !== undefined ? producto.stock : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showMovementModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Registrar Movimiento de Inventario</h2>
              <button className="close-btn" onClick={() => setShowMovementModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitMovement}>
              <div className="form-group">
                <label>Producto</label>
                <select 
                  name="id_producto" 
                  value={movementForm.id_producto} 
                  onChange={handleProductSelect}
                  required
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map(producto => (
                    <option key={producto.id_producto} value={producto.id_producto}>
                      {producto.codigo} - {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProduct && (
                <div className="selected-product-info">
                  <p><strong>Stock actual:</strong> {selectedProduct.stock}</p>
                </div>
              )}
              
              <div className="form-group">
                <label>Tipo de Movimiento</label>
                <select 
                  name="tipo_movimiento" 
                  value={movementForm.tipo_movimiento}
                  onChange={handleMovementFormChange}
                  required
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                  <option value="AJUSTE">Ajuste de Inventario</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Cantidad</label>
                <input 
                  type="number" 
                  name="cantidad" 
                  value={movementForm.cantidad}
                  onChange={handleMovementFormChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Precio Unitario</label>
                <input 
                  type="number" 
                  name="precio_unitario" 
                  value={movementForm.precio_unitario}
                  onChange={handleMovementFormChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Referencia (Opcional)</label>
                <input 
                  type="text" 
                  name="referencia" 
                  value={movementForm.referencia}
                  onChange={handleMovementFormChange}
                  placeholder="Ej: Orden de compra #123"
                />
              </div>
              
              <div className="form-group">
                <label>Notas (Opcional)</label>
                <textarea 
                  name="notas" 
                  value={movementForm.notas}
                  onChange={handleMovementFormChange}
                  placeholder="Detalles adicionales sobre este movimiento"
                  rows="3"
                />
              </div>
              
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={() => setShowMovementModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Registrar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showErrorModal && (
        <div className="modal-backdrop">
          <div className="error-modal">
            <div className="modal-content">
              <h2>⚠️ Error</h2>
              <p>{errorModalMessage}</p>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowErrorModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodegaPage;