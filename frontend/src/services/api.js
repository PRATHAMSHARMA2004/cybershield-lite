import axios from "axios";

const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://cybershield-lite.onrender.com/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("cs_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle auth errors
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cs_token");
      localStorage.removeItem("cs_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// AUTH
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

// SCANS
export const startScan = (data) => API.post("/scan/website", data);
export const getScanResult = (scanId) => API.get(`/scan/${scanId}`);
export const getScanHistory = (page = 1) =>
  API.get(`/scan/history?page=${page}`);

// PHISHING
export const analyzePhishing = (emailContent) =>
  API.post("/phishing/analyze", { emailContent });

export const getPhishingHistory = (page = 1) =>
  API.get(`/phishing/history?page=${page}`);

// DASHBOARD
export const getDashboard = () => API.get("/dashboard");

// REPORT DOWNLOAD
export const downloadReport = async (scanId) => {
  const response = await API.get(`/report/${scanId}`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `cybershield-report-${scanId}.pdf`);

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

export default API;