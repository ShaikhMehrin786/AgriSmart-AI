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

// Fetch weather with optional geolocation and pathogen risk query
export const fetchWeather = async (lat = null, lon = null, disease = null) => {
  const params = {};
  if (lat != null && lon != null) {
    params.lat = lat;
    params.lon = lon;
  }
  if (disease) {
    params.disease = disease;
  }
  const res = await api.get('/advisory/weather', { params });
  return res.data;
};

// Fetch smart irrigation recommendation
export const fetchIrrigationPlan = async (formData) => {
  const res = await api.post('/advisory/irrigation', formData);
  return res.data;
};

// Fetch integrated agronomy recommendations
export const fetchRecommendations = async (payload) => {
  const res = await api.post('/advisory/recommendations', payload);
  return res.data;
};

// Fetch deterministic sustainability score
export const fetchSustainabilityScore = async (payload = null) => {
  if (payload) {
    const res = await api.post('/advisory/sustainability-score', payload);
    return res.data;
  }
  const res = await api.get('/advisory/sustainability-score');
  return res.data;
};

// Fetch supported disease catalog
export const fetchDiseases = async (params = {}) => {
  const res = await api.get('/advisory/diseases', { params });
  return res.data;
};

// Fetch specific disease monograph
export const fetchDiseaseByName = async (diseaseName, crop = null) => {
  const params = crop ? { crop } : {};
  const res = await api.get(`/advisory/diseases/${encodeURIComponent(diseaseName)}`, { params });
  return res.data;
};

export default api;
