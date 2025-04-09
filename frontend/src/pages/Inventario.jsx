import React, { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../api/inventario';
import Navbar from '../components/Navbar';
import '../styles/inventario.css';

// Agrega esta función formatadora en la parte superior de tu componente InventarioPage
const formatCOP = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const InventarioPage = ({ userData }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    codigo: '',
    nombre: '',
    talla: '',
    marca: '',
    categoria: ''
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    talla: '',
    color: '',  // Add color field
    marca: '',
    categoria: '',
    precio_compra: '',  // Change to precio_compra
    precio_venta: '',   // Change to precio_venta
    stock: '',
    imagen_url: ''      // Optional field
  });
  // Agrega un estado para la vista previa de la imagen
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch products when component mounts
  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Sesión expirada. Por favor inicie sesión nuevamente.');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        return;
      }
      
      setLoading(true);
      const data = await getProductos(filters);
      if (data) {
        setProductos(data);
      } else {
        setError('No se recibieron datos del servidor.');
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron cargar los productos. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchProductos();
  };

  const resetFilters = () => {
    setFilters({
      codigo: '',
      nombre: '',
      talla: '',
      marca: '',
      categoria: ''
    });
    fetchProductos();
  };

  // Open Create Modal
  const handleCreateClick = () => {
    setProductForm({
      codigo: '',
      nombre: '',
      descripcion: '',
      talla: '',
      color: '',  // Add color field
      marca: '',
      categoria: '',
      precio_compra: '',  // Change to precio_compra
      precio_venta: '',   // Change to precio_venta
      stock: '',
      imagen_url: ''      // Optional field
    });
    setImagePreview(null);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setProductForm({
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      talla: product.talla,
      color: product.color,  // Add color field
      marca: product.marca,
      categoria: product.categoria,
      precio_compra: product.precio_compra.toString(),  // Change to precio_compra
      precio_venta: product.precio_venta.toString(),   // Change to precio_venta
      stock: product.stock.toString(),
      imagen_url: product.imagen_url || ''      // Optional field
    });
    setImagePreview(product.imagen_url || null);
    setShowEditModal(true);
  };

  // Open Delete Modal
  const handleDeleteClick = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };

  // Form input change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value
    });
    
    // Si estamos cambiando la URL de la imagen, actualiza la vista previa
    if (name === 'imagen_url' && value) {
      setImagePreview(value);
    }
  };

  // Create product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validaciones adicionales
      if (!productForm.codigo || productForm.codigo.trim() === '') {
        setError('El código del producto es obligatorio');
        return;
      }
      
      if (!productForm.nombre || productForm.nombre.trim() === '') {
        setError('El nombre del producto es obligatorio');
        return;
      }
      
      if (isNaN(parseFloat(productForm.precio_compra)) || parseFloat(productForm.precio_compra) <= 0) {
        setError('El precio de compra debe ser un número mayor que cero');
        return;
      }
      
      if (isNaN(parseFloat(productForm.precio_venta)) || parseFloat(productForm.precio_venta) <= 0) {
        setError('El precio de venta debe ser un número mayor que cero');
        return;
      }
      
      if (isNaN(parseInt(productForm.stock, 10))) {
        setError('El stock debe ser un número entero');
        return;
      }
      
      const payload = {
        ...productForm,
        precio_compra: parseFloat(productForm.precio_compra),
        precio_venta: parseFloat(productForm.precio_venta),
        stock: parseInt(productForm.stock, 10)
      };
      
      console.log("Enviando datos de producto:", payload);
      
      await createProducto(payload);
      setSuccess('Producto creado exitosamente');
      setShowCreateModal(false);
      fetchProductos();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error al crear producto:", err);
      
      let errorMessage = 'Error al crear el producto';
      
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = `Error: ${err.response.data.detail || 'Datos inválidos'}`;
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'No tienes permiso para crear productos';
        } else if (err.response.status === 404) {
          errorMessage = 'Endpoint no encontrado. Verifica la URL de la API';
        } else if (err.response.status === 500) {
          errorMessage = 'Error interno del servidor';
        } else {
          errorMessage = `Error: ${err.response.data.detail || err.message}`;
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet o la URL de la API';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        precio_compra: parseFloat(productForm.precio_compra),
        precio_venta: parseFloat(productForm.precio_venta),
        stock: parseInt(productForm.stock, 10)
      };
      
      await updateProducto(currentProduct.id_producto, payload);
      setSuccess('Producto actualizado exitosamente');
      setShowEditModal(false);
      fetchProductos();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      setError('Error al actualizar el producto');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    try {
      await deleteProducto(currentProduct.id_producto);
      setSuccess('Producto eliminado exitosamente');
      setShowDeleteModal(false);
      fetchProductos();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError('Error al eliminar el producto');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  // Close any modal
  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setCurrentProduct(null);
    setImagePreview(null);
  };

  // Añade este código en la parte superior del componente
  useEffect(() => {
    // Función para manejar el hover de imágenes
    const setupImageHover = () => {
      const images = document.querySelectorAll('.product-image');
      
      images.forEach(img => {
        // Crear un elemento div para la imagen ampliada
        const zoomView = document.createElement('div');
        zoomView.className = 'image-zoom-view';
        zoomView.style = `
          position: fixed;
          display: none;
          width: 300px;
          height: 300px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          background-color: #222831;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
          z-index: 1000;
          border: 2px solid #444;
          pointer-events: none;
        `;
        document.body.appendChild(zoomView);
        
        // Evento mouseenter - mostrar zoom
        img.addEventListener('mouseenter', (e) => {
          zoomView.style.backgroundImage = `url(${img.src})`;
          zoomView.style.display = 'block';
        });
        
        // Evento mousemove - mover zoom
        img.addEventListener('mousemove', (e) => {
          // Posicionar cerca del cursor pero evitando que salga de la pantalla
          const x = e.clientX + 20;
          const y = e.clientY - 150;
          
          // Ajustar si se sale de los bordes
          const rightEdge = window.innerWidth - 320;
          const bottomEdge = window.innerHeight - 320;
          
          const adjustedX = x > rightEdge ? rightEdge : x;
          const adjustedY = y < 20 ? 20 : (y > bottomEdge ? bottomEdge : y);
          
          zoomView.style.left = `${adjustedX}px`;
          zoomView.style.top = `${adjustedY}px`;
        });
        
        // Evento mouseleave - ocultar zoom
        img.addEventListener('mouseleave', () => {
          zoomView.style.display = 'none';
        });
      });
    };
    
    // Ejecutar después de que se carguen los productos
    if (productos.length > 0 && !loading) {
      // Pequeño retraso para asegurar que el DOM está listo
      setTimeout(setupImageHover, 300);
    }
    
    // Limpieza al desmontar
    return () => {
      const zoomViews = document.querySelectorAll('.image-zoom-view');
      zoomViews.forEach(view => view.remove());
    };
  }, [productos, loading]);

  if (loading && productos.length === 0) return (
    <div className="page-container">
      <Navbar userData={userData} />
      <div className="loading">Cargando inventario...</div>
    </div>
  );

  return (
    <div className="page-container">
      <Navbar userData={userData} />
      
      <div className="content-container">
        <div className="inventory-header">
          <h1>Inventario de Productos</h1>
          <button 
            className="btn-primary create-product-btn" 
            onClick={handleCreateClick}
          >
            Nuevo Producto
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {/* Filters Section */}
        <div className="filters-section">
          <h3>Filtros</h3>
          <form onSubmit={applyFilters} className="filters-form">
            <div className="filters-row">
              <div className="filter-group">
                <label>Código</label>
                <input 
                  type="text" 
                  name="codigo" 
                  value={filters.codigo}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={filters.nombre}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label>Talla</label>
                <input 
                  type="text" 
                  name="talla" 
                  value={filters.talla}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label>Marca</label>
                <input 
                  type="text" 
                  name="marca" 
                  value={filters.marca}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label>Categoría</label>
                <input 
                  type="text" 
                  name="categoria" 
                  value={filters.categoria}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="filters-buttons">
              <button type="submit" className="btn-apply">Aplicar Filtros</button>
              <button type="button" className="btn-reset" onClick={resetFilters}>Reset</button>
            </div>
          </form>
        </div>
        
        {/* Products Table */}
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Talla</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Precio Compra</th>
                <th>Precio Venta</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No hay productos para mostrar</td>
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
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/80?text=Error";
                          }}
                        />
                      ) : (
                        <div className="no-image">📷</div>
                      )}
                    </td>
                    <td>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td>{producto.talla}</td>
                    <td>{producto.marca}</td>
                    <td>{producto.categoria}</td>
                    <td>{formatCOP(producto.precio_compra)}</td>
                    <td>{formatCOP(producto.precio_venta)}</td>
                    <td>{producto.stock}</td>
                    <td className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditClick(producto)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteClick(producto)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Crear Nuevo Producto</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label>Código</label>
                <input 
                  type="text" 
                  name="codigo" 
                  value={productForm.codigo}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={productForm.nombre}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input 
                  type="text" 
                  name="descripcion" 
                  value={productForm.descripcion}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Talla</label>
                <input 
                  type="text" 
                  name="talla" 
                  value={productForm.talla}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input 
                  type="text" 
                  name="color" 
                  value={productForm.color}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input 
                  type="text" 
                  name="marca" 
                  value={productForm.marca}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input 
                  type="text" 
                  name="categoria" 
                  value={productForm.categoria}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio de Compra</label>
                <input 
                  type="number" 
                  name="precio_compra" 
                  value={productForm.precio_compra}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio de Venta</label>
                <input 
                  type="number" 
                  name="precio_venta" 
                  value={productForm.precio_venta}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input 
                  type="number" 
                  name="stock" 
                  value={productForm.stock}
                  onChange={handleFormChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group image-input full-width">
                <label>URL de Imagen</label>
                <input 
                  type="text" 
                  name="imagen_url" 
                  value={productForm.imagen_url}
                  onChange={handleFormChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/100?text=Error";
                        setImagePreview(null);
                      }}
                    />
                    <span className="image-preview-text">Vista previa de la imagen</span>
                  </div>
                )}
              </div>
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-submit">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Product Modal */}
      {showEditModal && currentProduct && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Producto</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleUpdateProduct}>
              <div className="form-group">
                <label>Código</label>
                <input 
                  type="text" 
                  name="codigo" 
                  value={productForm.codigo}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={productForm.nombre}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input 
                  type="text" 
                  name="descripcion" 
                  value={productForm.descripcion}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Talla</label>
                <input 
                  type="text" 
                  name="talla" 
                  value={productForm.talla}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input 
                  type="text" 
                  name="color" 
                  value={productForm.color}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input 
                  type="text" 
                  name="marca" 
                  value={productForm.marca}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input 
                  type="text" 
                  name="categoria" 
                  value={productForm.categoria}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio de Compra</label>
                <input 
                  type="number" 
                  name="precio_compra" 
                  value={productForm.precio_compra}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio de Venta</label>
                <input 
                  type="number" 
                  name="precio_venta" 
                  value={productForm.precio_venta}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input 
                  type="number" 
                  name="stock" 
                  value={productForm.stock}
                  onChange={handleFormChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group image-input full-width">
                <label>URL de Imagen</label>
                <input 
                  type="text" 
                  name="imagen_url" 
                  value={productForm.imagen_url}
                  onChange={handleFormChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/100?text=Error";
                        setImagePreview(null);
                      }}
                    />
                    <span className="image-preview-text">Vista previa de la imagen</span>
                  </div>
                )}
              </div>
              <div className="form-buttons">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-submit">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentProduct && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Está seguro de que desea eliminar el producto <strong>{currentProduct.nombre}</strong>?</p>
              <p>Esta acción no se puede deshacer.</p>
            </div>
            <div className="form-buttons">
              <button className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button className="btn-submit" onClick={handleDeleteProduct}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;