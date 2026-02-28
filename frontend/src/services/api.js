import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Scans
export const startScan = (url) => API.post('/scan/website', { url });
export const getScanResult = (scanId) => API.get(`/scan/${scanId}`);
export const getScanHistory = (page = 1) => API.get(`/scan/history?page=${page}`);

// Phishing
export const analyzePhishing = (emailContent) =>
  API.post('/phishing/analyze', { emailContent });
export const getPhishingHistory = (page = 1) =>
  API.get(`/phishing/history?page=${page}`);

// Dashboard
export const getDashboard = () => API.get('/dashboard');

// Reports
export const downloadReport = async (scanId) => {
  const response = await API.get(`/report/${scanId}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cybershield-report-${scanId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default API;
