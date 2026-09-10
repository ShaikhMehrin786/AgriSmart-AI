// Axios API Client
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

// Auto-attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrismart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const predictLeafDisease = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/predictions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const fetchWeatherAndRisk = async (lat, lon, disease) => {
  const response = await api.get('/advisory/weather', {
    params: { lat, lon, disease }
  });
  return response.data;
};

export const fetchIrrigationAdvice = async (cropName, soilMoisturePercent) => {
  const response = await api.post('/advisory/irrigation', {
    cropName,
    soilMoisturePercent
  });
  return response.data;
};

export const fetchSustainabilityScore = async (practices) => {
  const response = await api.post('/advisory/sustainability', practices);
  return response.data;
};

export const sendAssistantQuery = async (question, diagnosisContext, weatherContext) => {
  const response = await api.post('/assistant/chat', {
    question,
    diagnosisContext,
    weatherContext
  });
  return response.data;
};

export const fetchScanHistory = async () => {
  const response = await api.get('/predictions/history');
  return response.data;
};

export default api;
