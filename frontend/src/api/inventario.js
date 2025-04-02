import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Get configuration with auth token
const getConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Helper function to handle auth errors
const handleAuthError = (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // Show unauthorized access message and delay redirect
    alert('Acceso no autorizado');
    // Use setTimeout to allow the alert to be shown before redirecting
    setTimeout(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    }, 500); // 500ms delay to show the alert
    return; // Don't throw the error after handling it
  }
  throw error; // Only throw if it's not a 401/403 error
};

// Get all products with optional filters
export const getProductos = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Log the request info for debugging
    console.log('Fetching products with token:', !!localStorage.getItem('token'));
    console.log('API URL:', `${API_URL}/productos`);
    
    // Add filters to query params
    if (filters.codigo) params.append('codigo', filters.codigo);
    if (filters.nombre) params.append('nombre', filters.nombre);
    if (filters.talla) params.append('talla', filters.talla);
    if (filters.marca) params.append('marca', filters.marca);
    if (filters.categoria) params.append('categoria', filters.categoria);
    
    const response = await axios.get(
      `${API_URL}/productos?${params.toString()}`, 
      getConfig()
    );
    console.log('Products API response:', response);
    return response.data;
  } catch (error) {
    console.error("Error fetching products details:", error);
    console.error("Response data:", error.response?.data);
    console.error("Response status:", error.response?.status);
    handleAuthError(error);
  }
};

// Get product by ID
export const getProductoById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/productos/${id}`, getConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    handleAuthError(error);
  }
};

// Create new product
export const createProducto = async (productoData) => {
  try {
    const response = await axios.post(
      `${API_URL}/productos`,
      productoData,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);
    handleAuthError(error);
  }
};

// Update product
export const updateProducto = async (id, productoData) => {
  try {
    const response = await axios.put(
      `${API_URL}/productos/${id}`,
      productoData,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating product:", error);
    handleAuthError(error);
  }
};

// Delete product
export const deleteProducto = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/productos/${id}`,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error);
    handleAuthError(error);
  }
};