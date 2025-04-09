import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/movimientos.css';

// Define API_URL directly as in other files
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const MovimientosPage = ({ userData }) => {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Obtener movimientos
        const movimientosResponse = await axios.get(`${API_URL}/movimientos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Obtener productos
        const productosResponse = await axios.get(`${API_URL}/productos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Crear mapa de productos por ID
        const productosMap = {};
        productosResponse.data.forEach(producto => {
          productosMap[producto.id_producto] = producto;
        });
        
        // Enriquecer los movimientos con información de productos
        const movimientosEnriquecidos = movimientosResponse.data.map(mov => ({
          ...mov,
          producto: productosMap[mov.id_producto] || { nombre: `Producto #${mov.id_producto}` }
        }));
        
        setMovimientos(movimientosEnriquecidos);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar los datos.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div className="page-container">
      <Navbar userData={userData} />
      
      <div className="content-container">
        <div className="inventory-header">
          <h1>Historial de Movimientos</h1>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Cargando movimientos...</div>
        ) : (
          <div className="movements-table-container">
            <table className="movements-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Usuario</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No hay movimientos para mostrar</td>
                  </tr>
                ) : (
                  movimientos.map(mov => (
                    <tr key={mov.id_movimiento}>
                      <td>{new Date(mov.fecha_movimiento).toLocaleString()}</td>
                      <td>
                        {/* Manejar diferentes formas en que podría venir la información del producto */}
                        {mov.producto?.nombre || 
                         (typeof mov.producto === 'string' ? mov.producto : 
                         (mov.producto_nombre || `Producto #${mov.id_producto}`))}
                      </td>
                      <td className={`tipo-${mov.tipo_movimiento.toLowerCase()}`}>
                        {mov.tipo_movimiento}
                      </td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.usuario_cedula}</td>
                      <td>{mov.referencia || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovimientosPage;