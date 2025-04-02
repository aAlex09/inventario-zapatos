import React, { useState, useEffect } from 'react';
import '../styles/forms.css';

const ProductoForm = ({ producto, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio_compra: '',
    precio_venta: '',
    stock: '',
    talla: '',
    color: '',
    marca: '',
    categoria: '',
    imagen_url: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Si es modo edición, llenar el formulario con los datos del producto
    if (producto) {
      setFormData({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio_compra: producto.precio_compra || '',
        precio_venta: producto.precio_venta || '',
        stock: producto.stock || '',
        talla: producto.talla || '',
        color: producto.color || '',
        marca: producto.marca || '',
        categoria: producto.categoria || '',
        imagen_url: producto.imagen_url || ''
      });
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.codigo) newErrors.codigo = "El código es obligatorio";
    if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.precio_compra) newErrors.precio_compra = "El precio de compra es obligatorio";
    else if (isNaN(formData.precio_compra)) newErrors.precio_compra = "Debe ser un número";
    
    if (!formData.precio_venta) newErrors.precio_venta = "El precio de venta es obligatorio";
    else if (isNaN(formData.precio_venta)) newErrors.precio_venta = "Debe ser un número";
    
    if (!formData.stock) newErrors.stock = "El stock es obligatorio";
    else if (isNaN(formData.stock)) newErrors.stock = "Debe ser un número";
    
    if (!formData.talla) newErrors.talla = "La talla es obligatoria";
    if (!formData.color) newErrors.color = "El color es obligatorio";
    if (!formData.marca) newErrors.marca = "La marca es obligatoria";
    if (!formData.categoria) newErrors.categoria = "La categoría es obligatoria";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Convertir valores numéricos
      const productoData = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra),
        precio_venta: parseFloat(formData.precio_venta),
        stock: parseInt(formData.stock, 10)
      };
      
      onSubmit(productoData);
    }
  };

  return (
    <div className="form-container">
      <h2>{producto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className={errors.codigo ? 'input-error' : ''}
            />
            {errors.codigo && <span className="error-text">{errors.codigo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'input-error' : ''}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="precio_compra">Precio Compra *</label>
            <input
              type="text"
              id="precio_compra"
              name="precio_compra"
              value={formData.precio_compra}
              onChange={handleChange}
              className={errors.precio_compra ? 'input-error' : ''}
            />
            {errors.precio_compra && <span className="error-text">{errors.precio_compra}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="precio_venta">Precio Venta *</label>
            <input
              type="text"
              id="precio_venta"
              name="precio_venta"
              value={formData.precio_venta}
              onChange={handleChange}
              className={errors.precio_venta ? 'input-error' : ''}
            />
            {errors.precio_venta && <span className="error-text">{errors.precio_venta}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock *</label>
            <input
              type="text"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className={errors.stock ? 'input-error' : ''}
            />
            {errors.stock && <span className="error-text">{errors.stock}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="talla">Talla *</label>
            <input
              type="text"
              id="talla"
              name="talla"
              value={formData.talla}
              onChange={handleChange}
              className={errors.talla ? 'input-error' : ''}
            />
            {errors.talla && <span className="error-text">{errors.talla}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="color">Color *</label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className={errors.color ? 'input-error' : ''}
            />
            {errors.color && <span className="error-text">{errors.color}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="marca">Marca *</label>
            <input
              type="text"
              id="marca"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              className={errors.marca ? 'input-error' : ''}
            />
            {errors.marca && <span className="error-text">{errors.marca}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="categoria">Categoría *</label>
            <input
              type="text"
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={errors.categoria ? 'input-error' : ''}
            />
            {errors.categoria && <span className="error-text">{errors.categoria}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="imagen_url">URL de Imagen</label>
          <input
            type="text"
            id="imagen_url"
            name="imagen_url"
            value={formData.imagen_url}
            onChange={handleChange}
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            {producto ? 'Actualizar' : 'Crear'} Producto
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductoForm;