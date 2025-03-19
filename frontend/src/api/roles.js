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

// Get para todos los roles 
export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/roles`, getConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};