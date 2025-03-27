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

// Get user functionalities
export const getUserFunctionalities = async (cedula) => {
  try {
    const response = await axios.get(`${API_URL}/users/${cedula}/funcionalidades`, getConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching user functionalities:", error);
    // If auth error, clean token and redirect to login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// Get all available functionalities
export const getAllFunctionalities = async () => {
  try {
    const response = await axios.get(`${API_URL}/funcionalidades`, getConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching functionalities:", error);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// Assign functionality to user
export const assignFunctionality = async (cedula, functionalityId) => {
  try {
    const response = await axios.post(
      `${API_URL}/users/${cedula}/funcionalidades/${functionalityId}`, 
      {}, 
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error assigning functionality:", error);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

// Remove functionality from user
export const removeFunctionality = async (cedula, functionalityId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/users/${cedula}/funcionalidades/${functionalityId}`,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error removing functionality:", error);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};