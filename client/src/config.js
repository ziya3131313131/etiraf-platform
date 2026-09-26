// API Configuration
const isDevelopment = window.location.hostname === 'localhost';

export const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://etiraf-backend.onrender.com';

export const API_BASE = `${API_URL}/api`;

export const SOCKET_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://etiraf-backend.onrender.com';

// Axios default konfiqurasiyası
import axios from 'axios';

axios.defaults.timeout = 30000; // 30 saniyə
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor - token əlavə et
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request xətası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - xəta idarəetməsi
axios.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout:', error.config?.url);
    } else if (error.response) {
      console.error(`❌ ${error.response.status} ${error.config?.url}:`, error.response.data);
    } else if (error.request) {
      console.error('🔌 Network xətası - Server cavab vermir:', error.config?.url);
    } else {
      console.error('❌ Xəta:', error.message);
    }
    return Promise.reject(error);
  }
);

console.log('🔧 Config yükləndi:', {
  environment: isDevelopment ? 'Development' : 'Production',
  API_URL,
  API_BASE,
  SOCKET_URL
});
