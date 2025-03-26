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

// Get all users
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, getConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// Get a single user by cedula
export const getUserByCedula = async (cedula) => {
  try {
    const response = await axios.get(`${API_URL}/users/${cedula}`, getConfig());
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// Crear un nuevo user
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData, getConfig());
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// acualizar un user (usando cedula)
export const updateUser = async (cedula, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/${cedula}`, userData, getConfig());
    return response.data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// borrar un user (usando cedula)
export const deleteUser = async (cedula) => {
  try {
    await axios.delete(`${API_URL}/users/${cedula}`, getConfig());
    return true;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};