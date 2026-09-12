import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch scan/prediction history
export const fetchScanHistory = async () => {
  const res = await api.get('/predictions/history');
  return res.data;
};

// Send a message to the AI assistant
export const sendAssistantQuery = async (message, prediction = null, weather = null) => {
  const res = await api.post('/assistant/chat', { message, prediction, weather });
  return res.data.data;
};

export default api;
