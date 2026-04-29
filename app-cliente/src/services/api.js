import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:3001/api' : '/_/backend/api'),
});

export default api;
