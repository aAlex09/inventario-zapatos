export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const getConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};