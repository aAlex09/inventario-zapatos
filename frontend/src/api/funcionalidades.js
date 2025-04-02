import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getConfig = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});



export const getFuncionalidades = async () => {
  try {
    const response = await axios.get(`${API_URL}/funcionalidades`, getConfig());
    return response.data;
  } catch (error) {
    console.error("Error fetching funcionalidades:", error);
    throw error;
  }
};

export const getUserFuncionalidades = async (cedula) => {
  try {
    const response = await axios.get(
      `${API_URL}/users/${cedula}/funcionalidades`, 
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user funcionalidades:", error);
    throw error;
  }
};

export const getUserFuncionalidadesActivas = async (cedula) => {
  try {
    const response = await axios.get(
      `${API_URL}/users/${cedula}/funcionalidades-activas`, 
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user funcionalidades:", error);
    throw error;
  }
};

export const actualizarFuncionalidadesUsuario = async (cedula, funcionalidades) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/${cedula}/funcionalidades`,
      { funcionalidades },
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating funcionalidades:", error);
    throw error;
  }
};

