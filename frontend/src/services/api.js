import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Single place for backend API base URL so all requests stay consistent.
const BASE_URL = 'http://192.168.30.23:5000/api';
// Example: 'http://192.168.1.5:5000/api'
// After Railway deploy, change to:
// const BASE_URL = 'https://your-app.up.railway.app/api';

// Shared axios instance keeps timeout and base URL same for every call.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Adds saved JWT token automatically so protected APIs work without manual headers.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs are separated for signup/login OTP flow.
export const signup = (username, email, mobile) =>
  api.post('/auth/signup', { username, email, mobile });

export const verifySignup = (email, otp) =>
  api.post('/auth/verify-signup', { email, otp });

export const sendLoginOTP = (email) =>
  api.post('/auth/send-otp', { email });

export const verifyLoginOTP = (email, otp) =>
  api.post('/auth/verify-otp', { email, otp });

// Lead APIs used by dashboard, list, detail and form screens.
export const getStats = () => api.get('/leads/stats');
export const getLeads = (params = {}) => api.get('/leads', { params });
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (payload) => api.post('/leads', payload);
export const updateLead = (id, payload) => api.put(`/leads/${id}`, payload);
export const deleteLead = (id) => api.delete(`/leads/${id}`);

export { BASE_URL };
export default api;
