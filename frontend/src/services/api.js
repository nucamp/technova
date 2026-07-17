import axios from 'axios';

// Use relative path for all API requests to ensure they go through the WAF/proxy.
const API_URL = '/api';

// Debug: Log the API URL being used
console.log('API Configuration:', {
  port: window.location.port,
  envURL: process.env.REACT_APP_API_URL,
  finalURL: API_URL
});

// VULNERABILITY: No request/response interceptors for security
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// User API
export const getUser = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId, data) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

// Patient API
export const searchPatients = async (query) => {
  const response = await api.get(`/patients/search?query=${query}`);
  return response.data;
};

export const getPatient = async (patientId) => {
  const response = await api.get(`/patients/${patientId}`);
  return response.data;
};

// Medical Records API
export const getPatientRecords = async (patientId) => {
  const response = await api.get(`/records/patient/${patientId}`);
  return response.data;
};

export const uploadRecordFile = async (recordId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/records/${recordId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const downloadRecordFile = async (fileName) => {
  const response = await api.get(`/records/download/${fileName}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Appointments API
export const getAppointments = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/appointments?${queryString}`);
  return response.data;
};

export const createAppointment = async (data) => {
  const response = await api.post('/appointments', data);
  return response.data;
};

// Messages API
export const getMessages = async (userId) => {
  const response = await api.get(`/messages/${userId}`);
  return response.data;
};

export const sendMessage = async (data) => {
  const response = await api.post('/messages', data);
  return response.data;
};

// Admin API
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createBackup = async (filename) => {
  const response = await api.post('/admin/backup', { filename });
  return response.data;
};

// Debug API (VULNERABILITY: Exposed debug endpoints)
export const getEnvVars = async () => {
  const response = await api.get('/debug/env');
  return response.data;
};

export const getConfig = async () => {
  const response = await api.get('/debug/config');
      return response.data;
  };
  
  // Client-side Logging API
  export const logClientEvent = async (level, message, meta = {}) => {
    try {
      // VULNERABILITY: Client-side logging might send sensitive data if not filtered
      await api.post('/client-logs', { level, message, ...meta });
    } catch (error) {
      console.error('Failed to send client log:', error);
    }
  };
  
  export default api;
