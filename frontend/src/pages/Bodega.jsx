import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';

const BodegaPage = ({ userData }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    id_producto: '',
    tipo_movimiento: 'ENTRADA', // Default value (ENTRADA or SALIDA)
    cantidad: 1,
    referencia: '',
    notas: ''
  });
  const [success, setSuccess] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('/api/bodega/productos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProductos(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los productos');
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
      id_producto: productId
    });
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    
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
      const response = await axios.post('/api/movimientos', movementForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Show success message
      setSuccess('Movimiento registrado exitosamente');
      
      // Reset form and close modal
      setMovementForm({
        id_producto: '',
        tipo_movimiento: 'ENTRADA',
        cantidad: 1,
        referencia: '',
        notas: ''
      });
      setSelectedProduct(null);
      setShowMovementModal(false);
      
      // Refresh product list to show updated stock
      const productsResponse = await axios.get('/api/bodega/productos', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProductos(productsResponse.data);
    } catch (err) {
      setError('Error al registrar el movimiento');
      console.error(err);
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
                  productos.map(producto => (
                    <tr key={producto.id_producto}>
                      <td className="image-cell">
                        {producto.imagen_url ? (
                          <img 
                            src={producto.imagen_url} 
                            alt={producto.nombre} 
                            className="product-image"
                            onError={(e) => { e.target.src = '/placeholder.png'; }}
                          />
                        ) : (
                          <div className="no-image">📷</div>
                        )}
                      </td>
                      <td>{producto.codigo}</td>
                      <td>{producto.nombre}</td>
                      <td>{producto.stock}</td>
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
    </div>
  );
};

export default BodegaPage;