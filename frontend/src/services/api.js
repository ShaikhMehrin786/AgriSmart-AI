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

// Response interceptor: auto-logout on 401 Unauthorized (expired or revoked session)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Exclude deliberate login/register credentials failures from triggering auto-logout
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

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
