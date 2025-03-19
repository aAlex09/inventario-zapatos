import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    localStorage.setItem("token", response.data.access_token);
    return response.data;
};

export const requestPasswordReset = async (email) => {
    const response = await axios.post(`${API_URL}/request-password-reset`, { email });
    return response.data;
};

export const validateResetToken = async (token) => {
    const response = await axios.get(`${API_URL}/validate-reset-token/${token}`);
    return response.data;
};

export const resetPassword = async (token, password) => {
    const response = await axios.post(`${API_URL}/reset-password`, { token, password });
    return response.data;
};
